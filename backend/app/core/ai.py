import json
import re
import base64
import mimetypes
from typing import Any

import requests

from app.core.config import settings


OPENAI_API_KEY = settings.OPENAI_API_KEY
ENDPOINT = settings.ENDPOINT


SOAP_FALLBACK = {
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": "",
    "medications": [],
    "follow_up_needed": False,
    "follow_up_days": None,
}

DICTATION_FALLBACK = {
    "patient_name": "",
    "patient_age": "",
    "patient_gender": "",
    "date": "",
    "doctor_name": "",
    "indication": "",
    "history": "",
    "findings": "",
    "impression": "",
    "plan": "",
    "medications": [],
    "follow_up": "",
    "notes": "",
}


def _json_error(message: str, transcript: str = "") -> str:
    payload = {
        **SOAP_FALLBACK,
        "_error": message,
    }
    if transcript:
        payload["subjective"] = transcript
    return json.dumps(payload)


def _headers() -> dict[str, str]:
    if ENDPOINT and ("azure.com" in ENDPOINT or "cognitiveservices" in ENDPOINT):
        return {
            "api-key": OPENAI_API_KEY or "",
            "Content-Type": "application/json",
        }

    return {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }


def _extract_json(content: str) -> dict[str, Any]:
    cleaned = content.strip()

    if cleaned.startswith("```json"):
        cleaned = cleaned[7:].strip()
    elif cleaned.startswith("```"):
        cleaned = cleaned[3:].strip()

    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _normalize_soap(data: dict[str, Any]) -> dict[str, Any]:
    normalized = {**SOAP_FALLBACK, **data}

    for key in ("subjective", "objective", "assessment", "plan"):
        value = normalized.get(key)
        if isinstance(value, (dict, list)):
            normalized[key] = json.dumps(value, indent=2)
        elif value is None:
            normalized[key] = ""
        else:
            normalized[key] = str(value)

    meds = normalized.get("medications")
    normalized["medications"] = meds if isinstance(meds, list) else []
    normalized["follow_up_needed"] = bool(normalized.get("follow_up_needed"))

    follow_up_days = normalized.get("follow_up_days")
    try:
        normalized["follow_up_days"] = int(follow_up_days) if follow_up_days is not None else None
    except (TypeError, ValueError):
        normalized["follow_up_days"] = None

    return normalized


def _post_chat(body: dict[str, Any], timeout: int = 90):
    attempts = [body]

    completion_token_body = dict(body)
    if "max_tokens" in completion_token_body:
        completion_token_body["max_completion_tokens"] = completion_token_body.pop("max_tokens")
        attempts.append(completion_token_body)

    no_json_body = dict(body)
    no_json_body.pop("response_format", None)
    attempts.append(no_json_body)

    no_temp_body = dict(body)
    no_temp_body.pop("temperature", None)
    attempts.append(no_temp_body)

    no_temp_json_body = dict(completion_token_body)
    no_temp_json_body.pop("temperature", None)
    no_temp_json_body.pop("response_format", None)
    attempts.append(no_temp_json_body)

    seen = set()
    last_response = None

    for attempt in attempts:
        marker = json.dumps(attempt, sort_keys=True)
        if marker in seen:
            continue
        seen.add(marker)

        target_endpoint = ENDPOINT
        if target_endpoint and ("azure.com" in target_endpoint or "cognitiveservices" in target_endpoint):
            if "/openai/deployments/" not in target_endpoint:
                deployment_id = "gpt-5.4"
                api_version = "2025-01-01-preview"
                base_url = target_endpoint.rstrip("/")
                target_endpoint = f"{base_url}/openai/deployments/{deployment_id}/chat/completions?api-version={api_version}"

        response = requests.post(
            target_endpoint,
            headers=_headers(),
            json=attempt,
            timeout=timeout,
        )
        last_response = response

        if response.status_code != 400:
            return response

        error_text = response.text.lower()
        retryable = any(
            token in error_text
            for token in (
                "max_tokens",
                "max_completion_tokens",
                "response_format",
                "temperature",
                "unsupported parameter",
                "unrecognized request argument",
            )
        )

        if not retryable:
            return response

    return last_response


def generate_soap(text: str, historical_context: str = ""):
    transcript = (text or "").strip()

    if not transcript:
        return _json_error("Transcript is empty")

    if not OPENAI_API_KEY or not ENDPOINT:
        fallback = {**SOAP_FALLBACK, "subjective": transcript}
        return json.dumps(fallback)

    system_message = (
        "You are a medical AI assistant. Convert the consultation transcript "
        "into a SOAP note. Return only valid JSON with these exact keys: "
        "subjective, objective, assessment, plan, medications, "
        "follow_up_needed, follow_up_days. Medications must be an array."
    )

    if historical_context:
        system_message += (
            f"\n\n[HISTORICAL CONTEXT]\n{historical_context}\n\n"
            "CRITICAL INSTRUCTION: You MUST actively incorporate the patient's past medical history, "
            "allergies, and previous conditions from the [HISTORICAL CONTEXT] into this new SOAP note. "
            "Do not ignore the historical context. For example, explicitly list known allergies and past "
            "major conditions in the Subjective or Assessment sections, and ensure your Plan does not "
            "contradict known allergies."
        )

    body = {
        "messages": [
            {
                "role": "system",
                "content": system_message,
            },
            {
                "role": "user",
                "content": transcript,
            },
        ],
        "temperature": 0.2,
        "max_tokens": 900,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)

        print("SOAP STATUS:", response.status_code)

        if response.status_code != 200:
            print("SOAP RESPONSE:", response.text)
            return _json_error(f"AI request failed with status {response.status_code}", transcript)

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        soap = _normalize_soap(_extract_json(content))
        return json.dumps(soap)

    except Exception as e:
        print("SOAP AI ERROR:", str(e))
        return _json_error(f"SOAP generation exception: {str(e)}", transcript)


def generate_population_report(disease_context: str, population_context: str):
    """
    Analyzes the entire patient database for a specific disease/condition 
    and formats the research report within the standard SOAP JSON schema so it renders in the UI.
    """
    if not OPENAI_API_KEY or not ENDPOINT:
        return _json_error("AI population analysis unavailable")

    system_message = (
        "You are a medical AI assistant. The user has uploaded a medical document or consultation note without a specific Patient ID. "
        "Your task is to FIRST write a standard, comprehensive SOAP note for the specific patient/case described in the uploaded document. "
        "THEN, you must act as a population researcher. Analyze the [POPULATION CONTEXT] (which contains records from other patients "
        "in the database with similar conditions) and append your population research findings to the SOAP note.\n\n"
        "You MUST return the report strictly as valid JSON using the exact standard SOAP keys:\n"
        "- subjective: Write the Subjective section for the uploaded document.\n"
        "- objective: Write the Objective section for the uploaded document. At the end, add a paragraph titled 'POPULATION STATISTICS:' noting how many matching patients were found in the database.\n"
        "- assessment: Write the Assessment for the uploaded document. At the end, add a paragraph titled 'POPULATION TRENDS:' summarizing common symptoms/findings among the database matches.\n"
        "- plan: Write the Plan for the uploaded document. At the end, add a paragraph titled 'POPULATION TREATMENTS:' detailing the common medications/protocols prescribed to the database matches.\n"
        "- medications: Array of specific medication strings extracted from both the uploaded document and the population matches.\n"
        "- follow_up_needed: true/false.\n"
        "- follow_up_days: Number."
    )

    prompt = (
        f"--- Uploaded Document (Target Disease/Condition) ---\n{disease_context}\n\n"
        f"--- [POPULATION CONTEXT] (Matches found across database) ---\n{population_context}"
    )

    body = {
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)
        if response.status_code != 200:
            return _json_error(f"AI population request failed with status {response.status_code}")

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        soap = _normalize_soap(_extract_json(content))
        return json.dumps(soap)

    except Exception as e:
        return _json_error(f"Population report generation exception: {str(e)}")


def generate_soap_from_image(image_path: str, context: str = "", population_context: str = "", historical_context: str = ""):
    if not OPENAI_API_KEY or not ENDPOINT:
        return _json_error("AI image analysis unavailable")

    try:
        mime_type = mimetypes.guess_type(image_path)[0] or "image/png"
        with open(image_path, "rb") as image_file:
            encoded = base64.b64encode(image_file.read()).decode("utf-8")

        prompt = (
            
                "Read this medical image or scanned report and generate a SOAP note. "
                "If the image is an X-ray or radiology image, summarize visible/reportable findings carefully. "

                "IMPORTANT: If historical clinical context is provided, you MUST incorporate relevant prior "
                "medical history, previous imaging findings, allergies, prior diagnoses, and historical "
                "clinical information into the SOAP note. "

                "Do NOT ignore provided historical context. "
                "Only avoid inventing history that is NOT present in the supplied context. "

                "Return only JSON with keys: subjective, objective, assessment, plan, medications, "
                "follow_up_needed, follow_up_days."

        )
        if context:
            prompt = f"{prompt}\n\nAdditional context: {context}"

        if historical_context:
            prompt += f"""

            PATIENT HISTORICAL RECORDS:{historical_context}

            IMPORTANT:
            Use the patient historical records above while generating the SOAP note.
            Do NOT say "No historical medical records found" if history exists.
            Mention previous injuries, diagnoses, or prior imaging findings when relevant.

            """
        
        if population_context:
            prompt = f"{prompt}\n\n--- [POPULATION CONTEXT] (Matches found across database) ---\n{population_context}"
            system_msg = (
                "You are a careful medical AI assistant that extracts clinical information into SOAP JSON. "
                "Because the user provided [POPULATION CONTEXT], you must ALSO append population research findings "
                "to your SOAP output:\n"
                "- objective: At the end, add 'POPULATION STATISTICS:' noting how many matching patients were found.\n"
                "- assessment: At the end, add 'POPULATION TRENDS:' summarizing common database findings.\n"
                "- plan: At the end, add 'POPULATION TREATMENTS:' detailing medications prescribed to database matches."
            )
        else:
            system_msg = "You are a careful medical AI assistant that extracts clinical information into SOAP JSON."

        if historical_context:
            system_msg += (
                f"\n\n[HISTORICAL CONTEXT]\n{historical_context}\n\n"
                "CRITICAL INSTRUCTION: You MUST actively incorporate the patient's past medical history, "
                "allergies, and previous conditions from the [HISTORICAL CONTEXT] into this new SOAP note. "
                "Do not ignore the historical context. For example, explicitly list known allergies and past "
                "major conditions in the Subjective or Assessment sections, and ensure your Plan does not "
                "contradict known allergies."
            )

        body = {
            "messages": [
                {
                    "role": "system",
                    "content": system_msg,
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{encoded}"
                            },
                        },
                    ],
                },
            ],
            "temperature": 0.2,
            "max_tokens": 900,
            "response_format": {"type": "json_object"},
        }

        response = _post_chat(body)
        print("IMAGE SOAP STATUS:", response.status_code)

        if response.status_code != 200:
            print("IMAGE SOAP RESPONSE:", response.text)
            return _json_error(f"Image AI request failed with status {response.status_code}")

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        soap = _normalize_soap(_extract_json(content))
        return json.dumps(soap)

    except Exception as e:
        print("IMAGE SOAP ERROR:", str(e))
        return _json_error(f"Image SOAP generation exception: {str(e)}")


def generate_dictation_report(transcript: str, patient_context: str = "") -> dict:
    """
    Phase 1 — Doctor Dictation → Structured Report
    Takes a doctor's spoken transcript and generates a structured medical report
    suitable for letterhead printing.
    Returns a dict (not JSON string) for direct use in PDF generation.
    """
    transcript = (transcript or "").strip()
    if not transcript:
        return {**DICTATION_FALLBACK, "_error": "Transcript is empty"}

    if not OPENAI_API_KEY or not ENDPOINT:
        return {**DICTATION_FALLBACK, "findings": transcript}

    system_message = (
        "You are a professional medical report writer. "
        "A doctor has dictated the following notes verbally. "
        "Extract and structure the information into a formal medical report. "
        "Return ONLY valid JSON with EXACTLY these keys:\n"
        "- patient_name: Patient's full name (or 'Not specified')\n"
        "- patient_age: Patient's age (or '')\n"
        "- patient_gender: Patient's gender (or '')\n"
        "- date: Date of consultation (today if not mentioned)\n"
        "- doctor_name: Doctor's name if mentioned (or '')\n"
        "- indication: Why the patient is being seen (chief complaint)\n"
        "- history: Relevant medical history, symptoms, duration\n"
        "- findings: Clinical examination findings, vitals, test results\n"
        "- impression: Doctor's diagnosis or differential diagnosis\n"
        "- plan: Treatment plan, investigations ordered\n"
        "- medications: Array of strings — each medication with dosage\n"
        "- follow_up: Follow-up instructions (e.g. 'Review in 2 weeks')\n"
        "- notes: Any additional notes or instructions\n\n"
        "IMPORTANT: Write in formal medical language. Do not invent information not in the transcript."
    )

    user_message = f"Doctor's dictation:\n{transcript}"
    if patient_context:
        user_message += f"\n\n[Patient History from Records]\n{patient_context}"

    body = {
        "messages": [
            {"role": "system", "content": system_message},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.2,
        "max_tokens": 1000,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)
        print("DICTATION STATUS:", response.status_code)

        if response.status_code != 200:
            print("DICTATION RESPONSE:", response.text)
            return {**DICTATION_FALLBACK, "findings": transcript, "_error": f"AI request failed: {response.status_code}"}

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = _extract_json(content)

        # Normalize the result
        result = {**DICTATION_FALLBACK, **parsed}
        if not isinstance(result.get("medications"), list):
            result["medications"] = []

        return result

    except Exception as e:
        print("DICTATION AI ERROR:", str(e))
        return {**DICTATION_FALLBACK, "findings": transcript, "_error": str(e)}


def compare_medical_reports(existing_soap: dict, new_analysis: dict):
    if not OPENAI_API_KEY or not ENDPOINT:
        return {
            "summary": "AI comparison unavailable",
            "discrepancies": [],
            "new_info": [],
            "conflicts": [],
        }

    prompt = f"""
    Compare these two medical reports.

    Existing Report:
    {json.dumps(existing_soap)}

    New Report:
    {json.dumps(new_analysis)}

    Return ONLY JSON:
    {{
        "summary": "",
        "discrepancies": [],
        "new_info": [],
        "conflicts": []
    }}
    """

    body = {
        "messages": [
            {"role": "system", "content": "You are a clinical medical auditor."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 600,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)
        print("COMPARE STATUS:", response.status_code)

        if response.status_code != 200:
            print("COMPARE RESPONSE:", response.text)
            return {
                "summary": "Comparison failed",
                "discrepancies": [],
                "new_info": [],
                "conflicts": [],
            }

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        return _extract_json(content)

    except Exception as e:
        print("COMPARE ERROR:", str(e))
        return {
            "summary": f"Exception: {str(e)}",
            "discrepancies": [],
            "new_info": [],
            "conflicts": [],
        }


def check_drug_interactions(medications: list):
    if not medications or not OPENAI_API_KEY or not ENDPOINT:
        return []

    prompt = f"""
    Check for drug interactions in this medication list:

    {json.dumps(medications)}

    Return ONLY JSON:
    {{
        "interactions": [
            {{
                "severity": "",
                "interaction": "",
                "reason": ""
            }}
        ]
    }}
    """

    body = {
        "messages": [
            {"role": "system", "content": "You are a clinical pharmacologist."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 500,
        "response_format": {"type": "json_object"},
    }

    try:
        response = _post_chat(body)
        print("DRUG STATUS:", response.status_code)

        if response.status_code != 200:
            print("DRUG RESPONSE:", response.text)
            return []

        data = response.json()
        content = data["choices"][0]["message"]["content"]
        parsed = _extract_json(content)
        interactions = parsed.get("interactions", [])
        return interactions if isinstance(interactions, list) else []

    except Exception as e:
        print("DRUG ERROR:", str(e))
        return []


def answer_patient_question(report_data: dict, question: str, history: list = None) -> str:
    """
    Takes a patient's medical report data and a question they asked,
    and provides a clear, empathetic, jargon-free answer.
    Also accepts previous chat history to maintain conversation context.
    """
    if not OPENAI_API_KEY or not ENDPOINT:
        return "I'm sorry, the AI chat service is currently unavailable."

    prompt = f"""
    You are a compassionate, helpful medical AI assistant talking directly to a patient.
    The patient is asking a question about their medical report.
    
    Here is the data from their medical report:
    {json.dumps(report_data)}
    
    Instructions:
    1. Answer the patient's question clearly, using simple, non-medical jargon.
    2. Be empathetic and reassuring.
    3. ONLY use the information provided in the medical report. Do not invent diagnoses or treatments.
    4. If the answer is not in the report, gently let them know and advise them to consult their doctor.
    5. Keep the response concise, informative, and formatted with simple paragraphs or bullet points if needed.
    """

    messages = [{"role": "system", "content": prompt}]
    
    if history:
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
            
    messages.append({"role": "user", "content": question})

    body = {
        "messages": messages,
        "temperature": 0.3,
        "max_tokens": 800,
    }

    try:
        response = _post_chat(body)
        print("PATIENT CHAT STATUS:", response.status_code)

        if response.status_code != 200:
            print("PATIENT CHAT RESPONSE:", response.text)
            return "I apologize, but I'm having trouble processing your request right now. Please try again later."

        data = response.json()
        return data["choices"][0]["message"]["content"]

    except Exception as e:
        print("PATIENT CHAT ERROR:", str(e))
        return "An error occurred while trying to answer your question. Please try again later."

