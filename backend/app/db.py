"""Database access: one lazy connection pool, dict rows."""
import threading
from contextlib import contextmanager

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from .config import settings

_pool: ConnectionPool | None = None
_lock = threading.Lock()


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


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        with _lock:  # sync endpoints run in a thread pool: build the pool once
            if _pool is None:
                _pool = ConnectionPool(settings.database_url, min_size=1, max_size=8, open=True,
                                       kwargs={"row_factory": dict_row}, timeout=5)
    return _pool


def close_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.close()
        _pool = None


@contextmanager
def connection():
    with pool().connection() as conn:
        yield conn


def rows(sql: str, params: dict | tuple | None = None) -> list[dict]:
    with connection() as conn:
        return conn.execute(sql, params).fetchall()


def one(sql: str, params: dict | tuple | None = None) -> dict | None:
    with connection() as conn:
        return conn.execute(sql, params).fetchone()
