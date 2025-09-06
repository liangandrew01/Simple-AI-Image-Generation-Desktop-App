import base64
import io # an input/output tool (for reading/writing file-like things)
from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.model_loader import ModelLoader
import sys
sys.stdout.reconfigure(encoding='utf-8') # for emojis
import asyncio # so I can test the sleep function in the while loop to keep the websocket open
import json

app = FastAPI()

# Enable CORS server (so your Next.js can talk to Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js URL
    allow_methods=["*"],
    allow_headers=["*"],
)

connections = {}
queue = asyncio.Queue()
connections["websocketQueue"] = queue

# define root endpoint what the app should do if running. Root endpoint for when you visit http://localhost:8000/
@app.get("/")
async def root():
    return {"message": "AI Backend is running!", "status": "healthy"}

@app.get("/html")
async def get():
    return HTMLResponse("hello")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    connection_id = id(websocket)
    print(f"accepting websocket connection #{connection_id}")
    await websocket.accept()
    print(f"connection #{connection_id} accepted")

    # print("sending first websocket message")
    # await websocket.send_text(f"Hello from {connection_id}")

    try:
        while True: # continuous loop that will only break if an exception is raised (websocket disconnects)
            print("getting msg from queue")
            msg = await queue.get() # loop stays open and pauses here on await, letting other parts of code run
            print("sending:", msg)
            await websocket.send_text(json.dumps(msg))
    except WebSocketDisconnect:
        del connections["websocketQueue"]

# done through imported BaseModel from pydantic. fastAPI will know how to do parameter mapping for incoming requests
class PromptRequest(BaseModel):
    prompt: str
    samplingSteps: int
    guidance_scale: float = 7.5 # default is 7.5

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

        print(f"Received prompt: {request.prompt}") # fastAPI will look for .prompt property on request object because we defined the class using BaseModel above
        print(f"Sampling steps: {request.samplingSteps}")
    
        def generate_image():
            model_loader = connections["modelLoader"]

            # Generate image
            image = model_loader.generate_image(
                prompt=request.prompt,
                steps=int(request.samplingSteps),
                guidance_scale=request.guidance_scale
            )

            # Convert PIL image to base64 string for frontend
            # BytesIO: a container in memory where data is stored temporarily in byte format. It holds the data and lets you read from or write to it like a file.
            buffer = io.BytesIO() # create instance of BytesIO class from io toolbox that can temporarily hold bytes (images)
            image.save(buffer, format="PNG")
            image_base64 = base64.b64encode(buffer.getvalue()).decode()

            # return the response
            return {
                "message": "Image generated successfully",
                "status": "success",
                "image": f"data:image/png;base64,{image_base64}",
                "prompt": request.prompt
            }
        result = await asyncio.to_thread(generate_image)
        return result

    except Exception as e:
        if str(e) == "Generation aborted":
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
    # print("Loading AI model...")
    # model_loader.load_model()
    # print("Model ready!")
    model_loader = ModelLoader(queue)
    connections["modelLoader"] = model_loader
    model_loader.load_model()

# checks if file is being run directly vs being imported as a module
# __name__ is a built-in variable that refers to the current module (current file)
# when this main.py script is being run directly, the Python interpreter sets __name__ to the special value "__main__", indicating that the script is being run as the main program using python filename.py
if __name__ == "__main__": 
    # result = generate_image(prompt)
    # print("Image generated")
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
# the application is running using the uvicorn (server) library, which starts the server on localhost:8000 when this script is being run directly