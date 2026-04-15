# backend/app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./careai_m1.db"
    SECRET_KEY: str = "careai-module1-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080

    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    PILL_VERIFY_MODEL: str = "gemma3:4b"
    MEDGEMMA_MODEL: str = "hf.co/unsloth/medgemma-1.5-4b-it-GGUF:Q4_0"

    FRONTEND_URL: str = "http://localhost:3000"
    UPLOAD_DIR: str = "./uploads"

    class Config:
        env_file = ".env"
        extra = "ignore"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
