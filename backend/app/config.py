from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./drivetransparency.db"
    SECRET_KEY: str = "changeme-in-production"
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:19006", "*"]
    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
