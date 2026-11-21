#!/bin/sh
set -e
case "$1" in
  serve)
    python -m app.migrate
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
    ;;
  worker)
    exec python -m app.worker
    ;;
  migrate)
    exec python -m app.migrate
    ;;
  *)
    exec "$@"
    ;;
esac
