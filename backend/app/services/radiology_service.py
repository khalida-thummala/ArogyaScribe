import openai
import base64
import os
import json

endpoint = os.getenv("ENDPOINT", "")
api_key = os.getenv("OPENAI_API_KEY")

if endpoint and ("azure.com" in endpoint or "cognitiveservices" in endpoint):
    client = openai.AzureOpenAI(
        api_key=api_key,
        api_version="2025-01-01-preview",
        azure_endpoint=endpoint.split("/openai/")[0],
        timeout=30.0
    )
    # Determine chat model from deployment path or default to gpt-5.4
    chat_model = "gpt-5.4"
    if "deployments/" in endpoint:
        chat_model = endpoint.split("deployments/")[1].split("/")[0]
    embedding_model = "text-embedding-3-small"
else:
    client = openai.OpenAI(api_key=api_key, timeout=30.0)
    chat_model = "gpt-4o"
    embedding_model = "text-embedding-3-small"


async def generate_embedding(text: str):

    response = client.embeddings.create(
        model=embedding_model,
        input=text
    )

    return response.data[0].embedding


async def analyze_xray_image(
    image_bytes: bytes,
    history_text: str = ""
):

    base64_image = base64.b64encode(image_bytes).decode("utf-8")

    response = client.chat.completions.create(
        model=chat_model,
        messages=[
            {
                "role": "system",
                "content": f"""
                You are a highly capable general radiology AI assistant.
                You can analyze ANY medical image (e.g., MRI, CT scan, Ultrasound, X-ray) of ANY body part (e.g., head, brain, chest, abdomen, pelvis, extremities).
                Identify the modality (e.g., CT, MRI) and the anatomical region (e.g., Head, Pelvis) strictly based on the provided image, and provide a clinical analysis.
                Do not make assumptions about the body part or modality. Evaluate the image independently.

                Previous radiology history:

                {history_text}

                Analyze the uploaded medical image.

                Return ONLY valid JSON in this format:

                {{
                    "indication": "Reason for examination / clinical context",
                    "technique": "Modality and technique used (e.g. PA chest view)",
                    "findings": "Detailed radiographic findings",
                    "impression": "Concluding summary/impression",
                    "abnormalities": [],
                    "comparison": "Comparison with previous records"
                }}

                Do not return markdown.
                Do not return explanation.
                Only return JSON.
                """
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "Analyze this medical image (MRI, CT, X-ray, etc)."
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{base64_image}"
                        }
                    }
                ]
            }
        ],
        max_completion_tokens=1000
    )

    content = response.choices[0].message.content

    result = json.loads(content)

    return result