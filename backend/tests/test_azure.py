import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ENDPOINT = os.getenv("ENDPOINT")

print("Key length:", len(OPENAI_API_KEY) if OPENAI_API_KEY else 0)
print("Endpoint:", ENDPOINT)

headers = {
    "api-key": OPENAI_API_KEY,
    "Content-Type": "application/json"
}

body = {
    "messages": [
        {"role": "user", "content": "Hello! Reply with just the word 'SUCCESS'."}
    ]
}

res = requests.post(ENDPOINT, headers=headers, json=body)
print(res.status_code)
print(res.text)
