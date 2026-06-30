from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017/gyau"
    gemini_api_key: str = ""
    google_client_id: str | None = None
    class Config:
        env_file = ".env"

settings = Settings()
