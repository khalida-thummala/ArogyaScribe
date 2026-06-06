# MediScribe — Deployment Guide

## Stack Overview

| Layer | Service |
|---|---|
| Frontend | Vercel (Vite/React) |
| Backend | Render (FastAPI/Python) |
| Database | Supabase (PostgreSQL + pgvector) |
| AI / LLM | Azure OpenAI (GPT-4o Vision + embeddings) |
| Speech | AssemblyAI |
| File Storage | Backblaze B2 (audio + radiology images) |

---

## Local Development

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

pip install -r requirements.txt
```

Create `backend/.env`:

```env
# Database — Supabase PostgreSQL
DATABASE_URL=postgresql+psycopg2://postgres.<project-ref>:<password>@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?sslmode=require

# Auth
SECRET_KEY=your_long_random_secret_key
ALGORITHM=HS256

# Azure OpenAI
OPENAI_API_KEY=your_azure_openai_key
ENDPOINT=https://your-resource.cognitiveservices.azure.com/

# AssemblyAI — Speech Transcription
ASSEMBLYAI_API_KEY=your_assemblyai_key

# Backblaze B2 — File Storage
B2_KEY_ID=your_b2_key_id
B2_APPLICATION_KEY=your_b2_application_key
B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com
B2_BUCKET_NAME=mediscribe-audio

# Supabase (optional — direct REST access)
SUPABASE_URL=https://your-project.supabase.co/rest/v1/
SUPABASE_SECRET_KEY=your_supabase_service_role_key
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Start the frontend:

```bash
npm run dev
```

---

## Production Deployment

### Backend — Render

#### First-time setup

1. Go to [render.com](https://render.com) → New → Blueprint
2. Connect your GitHub repository
3. Render will detect `backend/render.yaml` automatically — click **Apply**
4. Go to your new service → **Environment** tab
5. Add each `sync: false` variable from the table below

#### Environment variables to set in Render dashboard

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Supabase connection string (Transaction mode, port 6543) |
| `SECRET_KEY` | Any long random string (use a password generator, 32+ chars) |
| `OPENAI_API_KEY` | Your Azure OpenAI key |
| `ENDPOINT` | Your Azure OpenAI endpoint URL |
| `ASSEMBLYAI_API_KEY` | Your AssemblyAI key |
| `B2_KEY_ID` | Your Backblaze B2 key ID |
| `B2_APPLICATION_KEY` | Your Backblaze B2 application key |
| `SUPABASE_URL` | Your Supabase REST URL |
| `SUPABASE_SECRET_KEY` | Your Supabase service role key |

> The `B2_ENDPOINT` and `B2_BUCKET_NAME` are already set as static values in `render.yaml` — no need to add them manually.

#### After deploying

- Render gives you a URL like `https://arogyascribe-backend.onrender.com`
- Copy this URL — you need it for the frontend step below
- Tables are created automatically on first startup (no manual migration needed)

---

### Frontend — Vercel

#### First-time setup

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL + `/api/v1` (e.g. `https://arogyascribe-backend.onrender.com/api/v1`) |

5. Click **Deploy**

#### Updating the CORS list

After you have your Vercel URL, make sure it's in `backend/app/main.py` under `allow_origins`. The current list already includes `arogyascribe-kohl.vercel.app` and `mediscribe-kohl.vercel.app`. If your Vercel URL is different, add it there and redeploy the backend.

---

## Redeployment (after code changes)

Both Render and Vercel auto-deploy when you push to your connected GitHub branch. No manual steps needed after the initial setup.

If you need to trigger a manual redeploy:
- **Render**: Dashboard → your service → **Manual Deploy** → Deploy latest commit
- **Vercel**: Dashboard → your project → **Deployments** → Redeploy

---

## Production Checklist

- [ ] Backend deployed on Render with all env vars set
- [ ] Frontend deployed on Vercel with `VITE_API_BASE_URL` pointing to Render
- [ ] Vercel domain added to CORS list in `backend/app/main.py`
- [ ] Supabase PostgreSQL in use (not SQLite)
- [ ] `backend/.env` is in `.gitignore` and never committed
- [ ] Backblaze B2 bucket exists and credentials are correct
- [ ] AssemblyAI key is active

---

## Troubleshooting

| Issue | Fix |
|---|---|
| 500 errors on backend | Check Render logs → usually a missing env var or DB connection issue |
| CORS error in browser | Add your Vercel URL to `allow_origins` in `main.py`, redeploy backend |
| Transcription fails | Check AssemblyAI key is valid and audio file is not empty |
| B2 upload fails | Verify B2 key ID, application key, and bucket name match exactly |
| Radiology image not loading | Check B2 bucket permissions — objects need to be accessible via signed URLs |
| Database tables missing | Restart the Render service — tables are auto-created on startup |
| Render service sleeping | Free tier sleeps after 15 min inactivity. Upgrade to Starter ($7/mo) to keep it awake |

---

## Key Service Dashboards

| Service | URL |
|---|---|
| Render (backend) | https://dashboard.render.com |
| Vercel (frontend) | https://vercel.com/dashboard |
| Supabase (database) | https://supabase.com/dashboard |
| Azure OpenAI | https://portal.azure.com |
| AssemblyAI | https://www.assemblyai.com/app |
| Backblaze B2 | https://secure.backblaze.com/b2_buckets.htm |
