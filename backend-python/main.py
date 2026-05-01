import base64
import io # an input/output tool (for reading/writing file-like things)
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.model_loader import ModelLoader
import sys
sys.stdout.reconfigure(encoding='utf-8') # for emojis
import asyncio # so I can test the sleep function in the while loop to keep the websocket open
import json
from pathlib import Path
import os, time
import logging

logging.basicConfig(
    filename="backend2.log",
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI() # create an empty server definition

# Enable CORS server (so your Next.js can talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Your Next.js URL
    allow_methods=["*"],
    allow_headers=["*"],
)

model_ready = False # declares a module-level variable for the main.py file; initialize to False
connections = {} # create an empty connections dict; will hold websocketQueue and ModelLoader class instance
queue = asyncio.Queue() # create a new async queue for sending websocket messages
connections["websocketQueue"] = queue # store the queue in connections dict for 

# path for saving and retrieving images
IMAGE_DIR = Path("app_data/images")

# define root endpoint what the app should do if running. Root endpoint for when you visit http://localhost:8000/
@app.get("/")
async def root():
    print("ROOT ENDPOINT HIT")
    return {"message": "AI Backend is running!", "status": "healthy"}
    

# need a non-root endpoint for HEAD requests sent by Electron wait-on
@app.head("/health")
async def health():
    if not model_ready:
        raise HTTPException(status_code=503, detail="Model loading")
    print("✅ HEALTH ROUTE HIT")
    return HTMLResponse(status_code=200)
    
@app.get("/html")
async def get():
    return HTMLResponse("hello")

@app.get("/fetchImageData")
def get_recent_image_data():
    files = sorted(IMAGE_DIR.glob("*.png"), key=os.path.getmtime, reverse=True)
    last_five = files[:5]
    result = [
        {"filename": f.name, "path": str(f), "created_at": time.ctime(os.path.getmtime(f))}
        for f in last_five
    ]
    return result

@app.get("/fetchImages/{filename}")
def get_recent_images(filename: str):
    file_path = IMAGE_DIR / filename
    return FileResponse(file_path) # uses Fastapi's FileResponse to read the bytes from the file_path. Returns actual image

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    connection_id = id(websocket)
    print(f"accepting websocket connection #{connection_id}")
    await websocket.accept()
    print(f"connection #{connection_id} accepted")

    # print("sending first websocket message")
    # await websocket.send_text(f"Hello from {connection_id}")

    model_loader: ModelLoader = connections["modelLoader"] # grab stored ModelLoader instance from connections dict. Each endpoint has its own local variable scope, so needed to store it and grab it

    async def send_loop():
        try:
            while True: # continuous loop that will only break if an exception is raised (websocket disconnects)
                print("getting msg from queue")
                msg = await queue.get() # loop stays open and pauses here on await, letting other parts of code run
                print("sending:", msg)
                await websocket.send_text(json.dumps(msg))
        except WebSocketDisconnect:
            model_loader.cancel()
            del connections["websocketQueue"]

    async def receive_loop():
        try:
            while True:
                abortMessage = await websocket.receive_text()
                data = json.loads(abortMessage)
                if data["type"] == "abort":
                    model_loader.cancel()
        except WebSocketDisconnect:
            model_loader.cancel()
            del connections["websocketQueue"]
    
    await asyncio.gather(send_loop(), receive_loop())

# done through imported BaseModel from pydantic. fastAPI will know how to do parameter mapping for incoming requests
class PromptRequest(BaseModel):
    prompt: str
    samplingSteps: int
    guidance_scale: float = 7.5 # default is 7.5
    imageHeight: int
    imageWidth: int

# /generate endpoint: 
@app.post("/generate")
async def generate_image(request: PromptRequest): # set request type as PromptRequest here
    try:
        # print("getting ready to yield to event loop")
        await asyncio.sleep(2) # pause and come back later sticky-note

        # terminalOutputBuffer = io.StringIO() # create empty string buffer
        # terminalErrorBuffer = io.StringIO()
        # originalOutput = sys.stdout # save the original output: create new var originalOutput and assign the value (referenced object) of sys.stdout, which represents the object which can .write() to the regular terminal output
        # originalError = sys.stderr
        # sys.stdout = terminalOutputBuffer # re-point sys.stdout to the new buffer which can also write. print() statements within backend libraries will always look for sys.stdout, which will now point to the buffer
        # sys.stderr = terminalErrorBuffer
        
        logger.info(f"Received prompt: {request.prompt}")
        print(f"Received prompt: {request.prompt}") # fastAPI will look for .prompt property on request object because we defined the class using BaseModel above
        print(f"Sampling steps: {request.samplingSteps}")
        print(f"Image height: {request.imageHeight}")
        print(f"Image width: {request.imageWidth}")
        print(f"Image height main.py: {request.imageHeight} (type: {type(request.imageHeight)})")
        print(f"Image width main.py: {request.imageWidth} (type: {type(request.imageWidth)})")

        def generate_image():
            model_loader = connections["modelLoader"]

            # call generate_image function from ModelLoader class
            # result of calling method is stored as "image"
            image = model_loader.generate_image(
                prompt=request.prompt,
                steps=int(request.samplingSteps),
                guidance_scale=request.guidance_scale,
                height=int(request.imageHeight),
                width=int(request.imageWidth),
            )

            # Convert PIL image to base64 string for frontend
            # BytesIO: a container in memory where data is stored temporarily in byte format. It holds the data and lets you read from or write to it like a file.
            buffer = io.BytesIO() # create instance of BytesIO class from io toolbox that can temporarily hold bytes (images)
            image.save(buffer, format="PNG")
            image_bytes = buffer.getvalue()
            image_base64 = base64.b64encode(image_bytes).decode()

            # save image to app_data
            print("IMAGE_DIR object:", IMAGE_DIR)
            print("Absolute path:", IMAGE_DIR.resolve())  # full path on your filesystem
            print("Exists before mkdir?", IMAGE_DIR.exists())        

            IMAGE_DIR.mkdir(parents=True, exist_ok=True)
            print("Exists after mkdir?", IMAGE_DIR.exists())
            print("Directory listing after mkdir:", os.listdir(IMAGE_DIR.parent))  # list contents of parent folder

            file_path = IMAGE_DIR / f"{request.prompt}.png" # this symbol / joins paths
            print("File path object:", file_path)
            print("File exists before writing?", file_path.exists())

            # “With this file opened in binary write mode, refer to it as f while doing the following.”
            # “With this notebook open, as long as I’m using it, call it ‘f’. When I’m done, close it.”
            # "with" sets up a safe zone context. set up something, use it safely, and clean up afterward
            # "with" safely open/use something that needs cleanup (like a file), and automatically close it afterward.
            # it’s called a context manager — an object that defines how to enter and exit a controlled “context.”
            # with → starts the context (sets up a safe zone where the file is opened).
            # open(file_path, "wb") → creates the resource (the file object).
            # as f → gives that object a temporary name (f) for you to use inside the indented block.
            with open(file_path, "wb") as f:
                f.write(image_bytes)
            print("File exists after writing?", file_path.exists())
            print("Saved file absolute path:", file_path.resolve())
            
            print(f"File path: ")
            print(file_path)
            print(f"IMAGE SAVED")

            # return the response
            return {
                "message": "Image generated successfully",
                "status": "success",
                "image": f"data:image/png;base64,{image_base64}",
                "prompt": request.prompt
            }
        result = await asyncio.to_thread(generate_image)
        # How to access properties of returned dict
        #image = result["image"]
        #prompt = result["prompt"]

        return result

    except Exception as e:
        logger.exception("Error generating image: %s", e)
        if str(e) == "Generation aborted":
            print(f"main.py /generate raised exception:")
            print(f"Error generating image: {e}")
            return {"status": "aborted"}
        raise HTTPException(status_code=500, detail=str(e))

    # finally:
    #     sys.stdout = originalOutput
    #     sys.stderr = originalError
    #     captured_output = terminalOutputBuffer.getvalue()
    #     captured_error = terminalErrorBuffer.getvalue()
    #     print("adding stdout to queue")
    #     print("adding stderr to queue")
    #     await queue.put(captured_output)
    #     await queue.put(captured_error)



@app.on_event("startup")
async def startup_event():
    """Load model when server starts"""
    global model_ready # means "update the module-level model_ready variable declared at the top for any changes to model_ready in this function"
    try:
        logger.info("***Startup event***")
        print("***Startup event***")
        # model_loader.load_model()
        # print("Model ready!")
        model_loader = ModelLoader(queue) # initialize a ModelLoader class instance on startup
        logger.info("ModelLoader initialized with queue")
        print("ModelLoader initialized with queue")
        connections["modelLoader"] = model_loader # store model_loader instance in connections dict
        await asyncio.to_thread(model_loader.load_model) # run .load_model() method of (defined with) ModelLoader class asynchronously to avoid blocking event loop
        model_ready = True # only set after model is loaded
        logger.info("load_model() method finished")
        print("load_model() method finished")
    except Exception as e:
        logger.exception("Error during startup: %s, e")
        model_ready = False


# checks if file is being run directly vs being imported as a module
# __name__ is a built-in variable that refers to the current module (current file)
# when this main.py script is being run directly, the Python interpreter sets __name__ to the special value "__main__", indicating that the script is being run as the main program using python filename.py
if __name__ == "__main__": 
    # result = generate_image(prompt)
    # print("Image generated")
    import uvicorn
    print(f"[PYTHON] main.exe started (PID {os.getpid()}) by parent PID {os.getppid()}")
    uvicorn.run(app, host="0.0.0.0", port=8000) # bind port 8000, loads registered FastAPI routes onto server, triggers @app.on_event("startup")
    print("uvicorn bound to port 8000")   
# the application is running using the uvicorn (server) library, which starts the server on localhost:8000 when this script is being run directly