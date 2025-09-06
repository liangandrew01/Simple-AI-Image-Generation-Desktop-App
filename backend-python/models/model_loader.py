import torch
from diffusers import StableDiffusionPipeline
from pathlib import Path
import gc
import sys
sys.stdout.reconfigure(encoding='utf-8')
import asyncio
import json

# # explicitly import accelerate
# try:
#     import accelerate
#     from accelerate import Accelerator
#     print(f"✅ Accelerate {accelerate.__version__} imported successfully")
#     ACCELERATE_AVAILABLE = True
# except ImportError:
#     print("⚠️ Accelerate not available")
#     ACCELERATE_AVAILABLE = False

class ModelLoader:
    def __init__(self, queue):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.pipeline = None
        self.queue = queue
        self.loop = asyncio.get_running_loop() # grabs current event loop
        self.abort = False

    def cancel(self):
        self.abort = True
   
    def progress_callback(self, pipeline, step, timestep, callback_kwargs):
        if self.abort:
            raise Exception("Generation aborted")

        progress = {"step": step, "progress": step / (pipeline.num_timesteps-1)}
        print(f"Step: {step}")
        print(f"Progress: {progress}")

        # # queue was created from queue = asyncio.Queue() and must be async: async queue.put(progress)
        # # but can't have await self.queue.put(progress) task inside sync callback function
        # # Huggingface pipeline callback must be synchronous
        # # using asyncio, we can schedule the async task for later without using keyword "await"
        # # but during image generation, the event loop is blocked and does not yield back until image is done, so the queue.puts don't happen until after 
        # loop = asyncio.get_event_loop() # older API with confusing behavior, returns current loop if exists, or creates one implicitly
        # loop.create_task(self.queue.put(progress))

        # From the separate image gen thread: "Hey main loop, when you get a chance, schedule this callback queue.put(progress) in a thread-safe way"
        # phone the assistant from outside the building to schedule a task
        self.loop.call_soon_threadsafe(
            asyncio.create_task, self.queue.put(progress)
        )

        return callback_kwargs

    def load_model(self, model_id="runwayml/stable-diffusion-v1-5"):
        """Load the Stable Diffusion model"""
        # model_id = "CompVis/stable-diffusion-v1-4"  # Slightly smaller
        print(f"Loading model on {self.device}...")
        # print(sys.executable)

        # returns a pre-trained model instance with the specified model_id
        # model object is created on the CPU by default
        self.pipeline = StableDiffusionPipeline.from_pretrained(
            model_id,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            safety_checker=None,
            requires_safety_checker=False,
            low_cpu_mem_usage=True,
            use_safetensors=True,
            device_map="balanced"
        )
        print("✅ Pipeline loaded with balanced device mapping")
        
        # Enable memory efficient attention
        self.pipeline.enable_attention_slicing() # basic optimization
        print("✅ Attention slicing enabled")

        # if ACCELERATE_AVAILABLE:
        #     try:
        #         self.pipeline.enable_sequential_cpu_offload() # might be crashing here
        #         print("✅ CPU offload enabled")
        #     except RuntimeError as e:
        #         print(f"⚠️ CPU offload failed: {e}") # execution continues here
        # else:
        #     print("⚠️ Skipping CPU offload - accelerate not available")

        # if hasattr(self.pipeline, 'enable_model_cpu_offload'):
        #     self.pipeline.enable_model_cpu_offload()

        # # move the model to the GPU if available
        # # right-hand side: returns a new object that is the model moved to the specified device, 
        # self.pipeline = self.pipeline.to(self.device)

        print("Model loaded successfully!")
        return self.pipeline



    def generate_image(self, prompt, steps=15, guidance_scale=7.5):
        """Generate image from prompt"""
        if self.pipeline is None:
            raise ValueError("Model not loaded. Call load_model() first.")
        
        print(f"Generating image for: {prompt}")

        # Manual memory cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        # with gradient tracking off, run the model with the specified parameters
        with torch.no_grad():
            result = self.pipeline(
                prompt=prompt,
                num_inference_steps=steps,
                guidance_scale=guidance_scale,
                height=384,
                width=384,
                callback_on_step_end=self.progress_callback
            )

        # Cleanup after generation
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        return result.images[0] # Python Imaging Library (PIL) image object