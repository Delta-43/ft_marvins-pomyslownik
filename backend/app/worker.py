"""Worker process (tasks B6, B7). Same image as the API, command `worker`.

- Takes queued runs one at a time (FOR UPDATE SKIP LOCKED) and executes them (app/pipeline.py).
- Queues a refresh run every REFRESH_HOURS, unless one is already queued or running (the single-flight index).
- On start, a run left "running" by a crash is closed as failed, so the single-flight lock never sticks.
"""
import datetime as dt
import logging
import time

import psycopg

from . import pipeline, translate
from .config import settings
from .db import connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
for noisy in ("httpx", "httpx2", "httpcore", "anthropic"):
    logging.getLogger(noisy).setLevel(logging.WARNING)  # request lines can carry API keys in the URL; never log them
log = logging.getLogger("worker")
POLL_SECONDS = 10


def claim() -> dict | None:
    with connection() as conn, conn.transaction():
        return conn.execute("""UPDATE collect_runs SET status = 'running', started_at = now()
                               WHERE id = (SELECT id FROM collect_runs WHERE status = 'queued' ORDER BY requested_at
                                           LIMIT 1 FOR UPDATE SKIP LOCKED) RETURNING *""").fetchone()


def schedule_refresh() -> None:
    if settings.refresh_hours <= 0:
        return
    with connection() as conn:
        last = conn.execute("SELECT max(requested_at) AS t FROM collect_runs WHERE mode = 'refresh'").fetchone()["t"]
        if last and dt.datetime.now(dt.UTC) - last < dt.timedelta(hours=settings.refresh_hours):
            return
        key = "schedule-" + dt.datetime.now(dt.UTC).strftime("%Y%m%d%H")
        try:
            conn.execute("INSERT INTO collect_runs (mode, idempotency_key, request_hash) VALUES ('refresh', %s, 'schedule')", (key,))
            log.info("queued scheduled refresh %s", key)
        except psycopg.errors.UniqueViolation:
            pass  # a run is already queued or running, or this hour's run exists


def recover() -> None:
    with connection() as conn:
        n = conn.execute("""UPDATE collect_runs SET status = 'failed', finished_at = now(),
                              log = log || ARRAY['closed by worker restart'] WHERE status = 'running'""").rowcount
    if n:
        log.warning("closed %s run(s) left running by a previous worker", n)


def main() -> None:
    log.info("worker started (refresh every %s h)", settings.refresh_hours)
    while True:
        try:
            recover()
            break
        except psycopg.OperationalError:
            log.info("waiting for the database")
            time.sleep(3)
    while True:
        try:
            schedule_refresh()
            run = claim()
            if run:
                log.info("run %s (%s) started", run["id"], run["mode"])
                pipeline.execute(run)
                log.info("run %s finished", run["id"])
                continue
            # B15: translate texts the API queued (Ukrainian, and Polish error messages). Idle time only.
            try:
                if translate.translate_pending():
                    continue
            except Exception:
                log.exception("translation step failed")
        except psycopg.Error:
            log.exception("database error in the worker loop")
        time.sleep(POLL_SECONDS)


if __name__ == "__main__":
    main()
