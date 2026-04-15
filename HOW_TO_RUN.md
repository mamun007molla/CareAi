# CareAI Module 1 — Windows এ Run করার Guide

## আগে Install করো (একবারই)

1. Miniconda  → https://docs.conda.io/en/latest/miniconda.html
2. Node.js    → https://nodejs.org  (v18 বা উপরে)
3. Ollama     → https://ollama.com/download  (AI এর জন্য)

---

## প্রথমবার Setup

### Step 1 — Anaconda Prompt খোলো
Windows search এ "Anaconda Prompt" লিখে Enter দাও।

### Step 2 — Backend setup
```
conda create -n careai python=3.11 -y
conda activate careai
cd C:\Users\YOUR_NAME\Downloads\careai_module1\backend
pip install -r requirements.txt
```

### Step 3 — Ollama AI Model download (optional)
```
ollama pull gemma3:4b
```
(700MB — একবারই লাগবে। না থাকলে OPENAI_API_KEY দিলেও চলবে)

---

## প্রতিদিন Run করার উপায়

### Terminal 1 — Backend (Anaconda Prompt):
```
conda activate careai
cd careai_module1\backend
python -m uvicorn app.main:app --reload --port 8000
```
✅ `Uvicorn running on http://127.0.0.1:8000` দেখালে Backend ready

### Terminal 2 — Frontend (যেকোনো CMD):
```
cd careai_module1\frontend
npm install          ← শুধু প্রথমবার
npm run dev
```
✅ `Local: http://localhost:3000` দেখালে Frontend ready

### Browser এ যাও:
http://localhost:3000

---

## Module 1 Features

| Feature | URL | AI? |
|---------|-----|-----|
| 1. Activity Tracker | /physical/activity-tracker | MediaPipe + XGBoost |
| 2. Medication Verify | /physical/medication-verify | ✅ gemma3:4b (Ollama) |
| 3. Activity Log | /physical/activity-log | ❌ No AI |
| 4. Routine Schedule | /physical/routine-schedule | ❌ No AI |

---

## Test করার উপায়

### Feature 2 — Medication Verify (AI):
1. /physical/medication-verify → এ যাও
2. Medicine এর ছবি upload করো
3. Prescribed medication name দাও (e.g. "Metformin 500mg")
4. "Verify Medication" click করো
5. AI result দেখাবে

### Feature 3 — Activity Log:
1. /physical/activity-log → এ যাও
2. "Log Activity" → type select → duration → Save
3. List এ দেখাবে, Dashboard এ stats update হবে

### Feature 4 — Routine Schedule:
1. /physical/routine-schedule → এ যাও
2. "Add Routine" → title, type, time, days select → Create
3. Dashboard এ today's routines দেখাবে

---

## সমস্যা হলে

| সমস্যা | সমাধান |
|--------|--------|
| `conda not found` | Anaconda Prompt ব্যবহার করো |
| `npm not found` | Node.js install করো |
| AI কাজ করছে না | `ollama serve` চালু আছে কিনা দেখো |
| Port busy | Backend: `--port 8001`, Frontend: auto 3001 |
