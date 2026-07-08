import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "MockVerse"
    API_V1_STR: str = "/api/v1"
    
    # Core API Integrations & Credentials
    GEMINI_API_KEY: str
    FIREBASE_CREDENTIALS_PATH: str | None = None

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/mockverse"
    REDIS_URL: str = "redis://localhost:6379/0"
    ENVIRONMENT: str = "development"

    # Instructs Pydantic to search for and parse an environment file cleanly
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Instantiate a global singleton to reuse across all application modules
settings = Settings(_env_file=os.path.join(os.getcwd(), ".env"))