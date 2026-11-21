"""Settings come from environment variables (see .env.example). Never hard-code secrets."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")  # repo-root .env when run from backend/

    database_url: str = ""
    admin_token: str = ""
    cors_origins: str = "http://localhost:3000"
    anthropic_api_key: str = ""
    openalex_api_key: str = ""
    freshness_days: int = 30
    seed_dir: str = "../data/seed"
    sources_dir: str = "../data/sources"  # targets.json; in the container: /srv/data/sources
    refresh_hours: int = 24  # the worker queues a refresh run this often. 0 turns the schedule off
    cache_dir: str = "../data/cache"  # source snapshots (not in git); in the container: /srv/data/cache
    version: str = "1.0.0-draft.2"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
