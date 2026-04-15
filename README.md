# CareAI — Module 1: Physical Monitoring

AI-powered elderly physical monitoring system.

## Features
- Feature 1: Activity Tracker (Multimodal Fall Detection — XGBoost + AST)
- Feature 2: Medication Verification (Ollama gemma3:4b vision)
- Feature 3: Activity Log
- Feature 4: Routine Schedule

## Tech Stack
- **Frontend**: Next.js 14 (JSX), Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, SQLite
- **AI**: Ollama (gemma3:4b, medgemma), XGBoost, MediaPipe, AST

## Setup

### 1. Backend
```bash
conda create -n careai python=3.11 -y
conda activate careai
cd backend
cp .env.example .env
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Fall Detection (extra)
```bash
pip install mediapipe xgboost torch torchaudio librosa transformers opencv-python pandas scikit-learn
```
FFmpeg also required: https://ffmpeg.org/download.html

## Model Files
Large model files not included in repo. Place them here:
- `backend/app/ai/fall_detection/models/audio/ast_model.torchscript.pt`
- `backend/app/ai/fall_detection/pose_landmarker.task`

## AI Models (Ollama)
```bash
ollama pull gemma3:4b
ollama pull hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q4_0
```
