"""Apply migrations/*.sql in order. Each file runs once. Tracked in the schema_migrations table."""
import pathlib
import sys

import psycopg

from .config import settings

MIGRATIONS = pathlib.Path(__file__).resolve().parent.parent / "migrations"


def main() -> None:
    if not settings.database_url:
        print("DATABASE_URL is not set. Skipping migrations.")
        return
    with psycopg.connect(settings.database_url, autocommit=True) as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())")
        done = {r[0] for r in conn.execute("SELECT name FROM schema_migrations")}
        for f in sorted(MIGRATIONS.glob("*.sql")):
            if f.name in done:
                continue
            print("applying", f.name)
            with conn.transaction():
                conn.execute(f.read_text(encoding="utf-8"))
                conn.execute("INSERT INTO schema_migrations (name) VALUES (%s)", (f.name,))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # fail loudly in the container log
        print("migration failed:", exc, file=sys.stderr)
        raise
