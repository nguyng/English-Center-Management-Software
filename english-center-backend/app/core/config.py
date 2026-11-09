from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import AnyHttpUrl, field_validator
import json

class Settings(BaseSettings):
    PROJECT_NAME: str = "English Center Management System"
    API_V1_STR: str = "/api"
    PORT: int = 5000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Security & JWT
    JWT_SECRET_KEY: str = "english-center-super-secret-jwt-key-change-in-production-2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/english_center_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Default Seed Credentials
    DEFAULT_SUPERADMIN_EMAIL: str = "super@saas.com"
    DEFAULT_SUPERADMIN_PASSWORD: str = "Password123@"
    DEFAULT_ADMIN_EMAIL: str = "admin@center.edu.vn"
    DEFAULT_ADMIN_PASSWORD: str = "Password123@"
    DEFAULT_TEACHER_EMAIL: str = "teacher@center.edu.vn"
    DEFAULT_TEACHER_PASSWORD: str = "Password123@"

    # Realtime Test Notifications (Telegram / Discord) for Mock Zalo Demo
    TELEGRAM_BOT_TOKEN: Union[str, None] = None
    TELEGRAM_CHAT_ID: Union[str, None] = None
    DISCORD_WEBHOOK_URL: Union[str, None] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

