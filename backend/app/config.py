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
    stale_project_years: int = 3  # a card about a project that ended longer ago than this is stale (#22)
    seed_dir: str = "../data/seed"
    sources_dir: str = "../data/sources"  # targets.json; in the container: /srv/data/sources
    refresh_hours: int = 24  # the worker queues a refresh run this often. 0 turns the schedule off
    cache_dir: str = "../data/cache"  # source snapshots (not in git); in the container: /srv/data/cache
    version: str = "1.1.0-draft.5"
    # Shared sandbox identities used by the demo (comma separated). They skip the per-identity sign-in limit, because
    # a whole jury signs in as one of them, and they cannot be deleted (known gap G1, docs/api/CONTRACT-REVIEW.md).
    demo_identities: str = "demo-jury"
    supported_languages: str = "pl,en,uk"
    public_web_url: str = "https://pomyslownik.delta43.net"  # links to card pages in relatedWork  # first one is the default and the fallback (B15)
    translate_batch: int = 40  # texts per translation call in the worker

    @property
    def demo_identity_set(self) -> set[str]:
        return {s.strip().lower() for s in self.demo_identities.split(",") if s.strip()}

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
