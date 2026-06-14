# ⚕️ ArogyaScribe

> **Note:** This project, formerly known as MediScribe, was renamed to ArogyaScribe during development.

**Live Deployment:** [https://mediscribe-kohl.vercel.app/](https://mediscribe-kohl.vercel.app/)

**ArogyaScribe** is a production-grade, AI-powered clinical documentation platform built to reduce administrative burdens for healthcare professionals. By natively integrating advanced speech-to-text (**AssemblyAI**) and **Retrieval-Augmented Generation (RAG)** via GPT-4, ArogyaScribe acts as an intelligent medical scribe—listening to patient consultations and automatically structuring the dialogue into clinical SOAP notes. 

Crucially, ArogyaScribe operates as a **standalone, fully native architecture**, meaning the entire AI workflow and RAG implementation runs directly on the backend without relying on external automation tools like n8n.

---

## ✨ Key Features

- 🎙️ **Live Consultation Recording** — Real-time audio capture with high-fidelity transcription powered by **AssemblyAI**.
- 📋 **Automated SOAP Notes** — Leverages **GPT-4** to automatically parse raw transcripts and generate structured clinical documentation (Subjective, Objective, Assessment, Plan).
- 🧠 **Native Retrieval-Augmented Generation (RAG)** — Seamlessly extracts clinical entities, queries historical medical records, and analyzes uploaded files using `pgvector` embeddings natively on the backend.
- 🤖 **AI Document & Radiology Analysis** — Upload medical records, PDFs, or Radiology images for automated clinical review.
- ⚙️ **No External Dependencies (No n8n)** — AI logic is handled robustly in the FastAPI backend, eliminating workflow platform lock-in.
- 👥 **Comprehensive EHR Features** — Manage patient histories, medical records, allergies, and medications.
- 📄 **Dynamic Report Generation** — View, edit, and export clinical notes seamlessly in PDF and DOCX formats.
- 📊 **Intelligent Analytics** — Real-time KPIs for clinic productivity and time-saving metrics.
- 🛡️ **Hardened Audit Trail** — HIPAA-aligned event logging for all clinical actions.
- 🔐 **Secure RBAC Authentication** — JWT-based Role-Based Access Control.

---

## 🔄 System Workflow & Role Hierarchy

ArogyaScribe operates with a strict hierarchy of roles, defining clear access boundaries across the platform:

### 1. Super Admin (Platform Owner)
- **Organization Management:** Creates Organizations by assigning them an email and password. Has exclusive authority to change Organization passwords.
- **Global Dashboard:** Views all Organizations, their active subscription plans, doctors, and patients. Clicking on an Organization displays its specific doctors and patients.
- **Plan Approvals:** Reviews and approves subscription plan upgrades (e.g., Basic to Premium) for Organizations after verifying payment.

### 2. Organization (Clinic / Hospital Admin)
- **Access:** Logs in using credentials provided by the Super Admin. *Note: Organizations cannot change their own password.*
- **Staff Management:** Adds Doctors by assigning them an email and password. The Organization can reset or change Doctor passwords.
- **Oversight:** Views all doctors and patients under their umbrella. Clicking on a specific doctor filters the view to show only that doctor's patients.
- **Subscription Upgrades:** When the current plan limit is reached, the Organization submits an upgrade form to the Super Admin for approval.

### 3. Doctor (Practitioner)
- **Access:** Logs in using credentials provided by their Organization. *Note: Doctors cannot change their own password.*
- **Patient Management:** Adds new Patients to the system.
- **Clinical View:** Views only their assigned patients. Clicking on a particular patient opens all clinical records specific to that patient.

### 4. Patient
- **Access:** Patients independently sign up and create their own accounts using their email and password.
- **Records View:** Logs in to securely check and review their own medical records.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| **Frontend** | [React 18](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/) |
| **Backend** | [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) with `pgvector` for RAG embeddings |
| **AI / LLM** | [Azure OpenAI (GPT-4o)](https://azure.microsoft.com/en-us/products/ai-services/openai-service) |
| **Transcription** | [AssemblyAI](https://www.assemblyai.com/) |
| **Cloud Storage** | [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html) |
| **Desktop App** | Configured for [Electron](https://www.electronjs.org/) builds |

---

## 🚀 Quick Start (Local Setup)

For highly detailed deployment instructions (Render, Vercel, Supabase), please refer to our [DEPLOYMENT.md](./DEPLOYMENT.md).

### 1. Clone the repository
```bash
git clone https://github.com/khalida-thummala/ArogyaScribe.git
cd ArogyaScribe
```

### 2. Set up the Backend
```bash
cd backend
python -m venv venv
# Activate virtual environment:
# source venv/bin/activate (Linux/Mac)
# venv\Scripts\activate (Windows)

pip install -r requirements.txt
```
> **Note:** Ensure you configure your `backend/.env` variables (Database URL, OpenAI keys, AssemblyAI keys) before running. Check `DEPLOYMENT.md` for exact variable names.

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the Frontend
```bash
cd ../frontend
npm install
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.

---

## 📁 Project Structure

- **/backend** — Python/FastAPI server containing the Core API, DB schema, and native AI/RAG models.
- **/frontend** — React/Vite web application housing the UI components, state management (Zustand), and data fetching.
- **/database** — Assorted migration utilities and database design references.

---

## 📄 License & Author

Developed by **Thummala Khalida** and **Gowthami Kanchi**.  
*ArogyaScribe — Empowering Healthcare through AI.*
