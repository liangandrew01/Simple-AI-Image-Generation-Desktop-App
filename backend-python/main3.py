from pathlib import Path
import os

IMAGE_DIR = Path("app_data/images")

def get_recent_images():
    # Get all files ending with .png
    files = list(IMAGE_DIR.glob("*.png"))

    # Sort by last modified time, newest first
    files.sort(key=os.path.getmtime, reverse=True)

    # Take the first 5
    last_five = files[:5]
    return last_five