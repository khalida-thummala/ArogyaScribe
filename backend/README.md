# ArogyaScribe Backend

AI-powered healthcare SaaS backend for managing patients, consultations, speech transcription, SOAP report generation, and AI document analysis.

---

## Overview

ArogyaScribe helps healthcare professionals:

* Register hospitals/clinics (multi-tenant SaaS)
* Manage healthcare staff with RBAC
* Store patient records
* Conduct consultations
* Upload/transcribe doctor-patient audio
* Generate SOAP clinical reports
* Run AI document analysis on uploaded medical files

---

## Tech Stack

* **Backend:** FastAPI
* **Database:** PostgreSQL
* **ORM:** SQLAlchemy
* **Authentication:** JWT
* **Password Security:** bcrypt
* **Speech Recognition:** Azure Speech API
* **AI Processing:** OpenAI/AI integration
* **API Testing:** Swagger UI

---

# System Architecture

```plaintext
Organization
   ↓
Users (RBAC)
   ↓
Patients
   ↓
Consultations
   ↓
Speech Transcription
   ↓
SOAP Reports
   ↓
AI Analysis
```

---

# Features

## 1. Authentication & Authorization

### Register

Creates:

* Organization
* Admin user

```http
POST /auth/register
```

### Login

```http
POST /auth/login
```

Returns:

* Access Token
* Refresh Token

### Refresh Token

```http
POST /auth/refresh
```

### Logout

```http
POST /auth/logout
```

---

## Role Based Access Control (RBAC)

Roles:

* admin
* practitioner
* supervisor
* viewer

Example:

* Admin → full access
* Practitioner → manage patients/consultations
* Supervisor → approve reports
* Viewer → read-only

---

# Database Tables

## Organizations

Stores clinic/hospital information.

Fields:

* organization_id
* name
* email
* phone
* created_at

---

## Users

Stores healthcare professionals.

Fields:

* user_id
* email
* password_hash
* full_name
* license_number
* organization_id
* role
* status
* email_verified
* phone
* timezone
* language_preference
* twofa_enabled
* failed_login_attempts
* last_login

---

## Patients

Stores patient records.

Fields:

* patient_id
* user_id
* organization_id
* first_name
* last_name
* DOB
* gender
* medical history
* allergies
* medications
* insurance details

---

## Consultations

Stores consultation sessions.

Fields:

* consultation_id
* patient_id
* user_id
* organization_id
* consultation_type
* chief_complaint
* audio metadata
* transcription
* notes

---

## Reports

Stores SOAP reports.

Fields:

* report_id
* consultation_id
* subjective
* objective
* assessment
* plan
* medications
* approval workflow

---

## AI Analysis Records

Stores AI document analysis.

Fields:

* analysis_id
* upload_id
* extracted_text
* generated SOAP
* confidence score
* approvals

---

# API Modules

## Auth APIs

* POST `/auth/register`
* POST `/auth/login`
* POST `/auth/refresh`
* POST `/auth/logout`

---

## Patient APIs

* POST `/patients/`
* GET `/patients/`
* GET `/patients/{id}`
* PUT `/patients/{id}`
* DELETE `/patients/{id}`

---

## Consultation APIs

* POST `/consultations/`
* POST `/consultations/{id}/start`
* POST `/consultations/{id}/end`
* GET `/consultations/{id}/report`

---

## Speech APIs

* POST `/speech/transcribe`

Supported format:

* WAV

---

## Report APIs

* GET `/reports/{id}`
* PUT `/reports/{id}`
* POST `/reports/{id}/approve`
* POST `/reports/{id}/sign`
* POST `/reports/{id}/archive`

---

## AI Analysis APIs

* POST `/ai-analysis/upload`
* POST `/ai-analysis/{id}/analyze`
* POST `/ai-analysis/{id}/approve`
* GET `/ai-analysis/{id}`

---

# Installation

```bash
git clone <repo-url>
cd arogyascribe-backend
```

Create virtual environment:

```bash
python -m venv venv
```

Activate:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create `.env`

```env
DATABASE_URL=
SECRET_KEY=
ALGORITHM=HS256
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=
OPENAI_API_KEY=
```

---

# Run Project

```bash
uvicorn app.main:app --reload
```

Swagger:

```plaintext
http://127.0.0.1:8000/docs
```

---

# End-to-End Workflow

```plaintext
Register
→ Login
→ Create Patient
→ Create Consultation
→ Start Consultation
→ Upload Audio
→ Transcribe
→ End Consultation
→ Generate SOAP Report
→ Approve Report
→ AI Analysis
```

---

# Future Improvements

* Docker deployment
* CI/CD pipeline
* AWS S3 storage
* WebSocket live transcription
* HIPAA compliance
* Audit logs
* Notification system
* Payment/subscription module

---

# Author

**Gowthami Kanchi**

Backend Developer – ArogyaScribe
