import asyncio
import os
import sys
from dotenv import load_dotenv

# Load env before importing radiology_service
load_dotenv(".env")

# Add the app directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.radiology_service import analyze_xray_image

async def main():
    image_path = os.path.join("uploads", "0a72d5e4-7c93-413f-879c-4dc271beca25_00000057_001.png")
    
    print(f"Reading image from {image_path}...")
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    print("Sending request to GPT-4o Vision...")
    result = await analyze_xray_image(image_bytes, "No previous history.")
    
    import json
    print("Result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    asyncio.run(main())
