from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://inventory:inventory@db:5432/inventory_db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"


settings = Settings()
