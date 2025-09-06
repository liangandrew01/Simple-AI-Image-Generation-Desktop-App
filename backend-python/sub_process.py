# # This is a subprocess-launching script that acts like a replacement for you typing python main.py manually
# # Instead of you being the operator in the terminal, the script says: “Hey Python, spin up another Python process (main.py), and let me capture its output.”

# # Python module that provides tools to work with async programming
# # it creates and runs an event loop (like a conductor of async events)
# # event loop is a specific object that controls the scheduling of async operations
# import asyncio 

# async def main():
#     process = await asyncio.create_subprocess_exec(
#         "python", "main.py",
#         stdout=asyncio.subprocess.PIPE,
#         stderr=asyncio.subprocess.PIPE
#     )

# asyncio.run(main())

import sys
sys.stderr.write("Hello1")
sys.stdout.write("Hello2")

