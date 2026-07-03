from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str
    mongodb_db_name: str = "safecheckin"

    # JWT
    jwt_secret: str
    jwt_algorithm: str = "HS256"

    # NVIDIA
    nvidia_api_key: str
    nvidia_model: str = "meta/llama-3.1-70b-instruct"

    # Backend URL — used to build photo URLs returned to the frontend
    backend_url: str = "http://localhost:5000"

    # Server
    port: int = 8000
    environment: str = "development"

    # CORS
    allowed_origins: str = "http://localhost:3000,http://localhost:8081,http://localhost:8082"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()