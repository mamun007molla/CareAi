# backend/app/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import create_tables
from app.routers import auth, physical

app = FastAPI(
    title="CareAI Module 1 — Physical Monitoring API",
    version="1.0.0",
    description="Module 1: Activity Tracker, Medication Verification, Activity Log, Routine Schedule",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001",
        "http://localhost:3002", "http://127.0.0.1:3002",
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(physical.router, prefix="/api/v1")

@app.on_event("startup")
async def startup():
    create_tables()
    print("✅ CareAI Module 1 API started.")

@app.get("/")
def root():
    return {"message": "CareAI Module 1 API", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "ok"}
