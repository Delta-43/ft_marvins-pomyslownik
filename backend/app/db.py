"""Database access. Task B2 adds the pool and query helpers."""
import psycopg

from .config import settings


def check_database() -> bool:
    """True when the database answers. Used by /health."""
    if not settings.database_url:
        return False
    try:
        with psycopg.connect(settings.database_url, connect_timeout=2) as conn:
            conn.execute("SELECT 1")
        return True
    except psycopg.Error:
        return False
