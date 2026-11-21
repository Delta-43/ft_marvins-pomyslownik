"""Settings come from environment variables (see .env.example). Never hard-code secrets."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = ""
    admin_token: str = ""
    cors_origins: str = "http://localhost:3000"
    anthropic_api_key: str = ""
    openalex_api_key: str = ""
    freshness_days: int = 30
    version: str = "1.0.0-draft.2"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
