from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Security Personal Blog"
    environment: str = "development"
    secret_key: str = Field(default="change-this-to-a-long-random-secret")
    access_token_expire_minutes: int = 1440
    database_url: str = "sqlite:///./data/blog.db"
    cors_origins: str = "http://localhost:5173,http://localhost:8080,http://127.0.0.1:5173"
    admin_email: str = "admin@example.com"
    admin_username: str = "admin"
    admin_password: str = "ChangeMe123!"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_runtime_security(self) -> None:
        if self.environment == "production":
            if self.secret_key == "change-this-to-a-long-random-secret" or self.secret_key.startswith("replace-"):
                raise RuntimeError("SECRET_KEY must be changed in production")
            if self.admin_password == "ChangeMe123!" or self.admin_password.startswith("replace-"):
                raise RuntimeError("ADMIN_PASSWORD must be changed in production")


@lru_cache
def get_settings() -> Settings:
    return Settings()
