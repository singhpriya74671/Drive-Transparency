from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./drivetransparency.db"
    SECRET_KEY: str = "changeme-in-production"

    # JSON list of browser origins allowed to call this API.
    # In production set it through the ALLOWED_ORIGINS environment variable,
    # e.g. ALLOWED_ORIGINS=["https://your-app.vercel.app"]
    # Localhost origins are only defaults for local development.
    ALLOWED_ORIGINS: List[str] = [
        "https://drive-transparency.vercel.app",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ]

    DEBUG: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
