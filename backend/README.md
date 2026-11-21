# Backend

FastAPI. One image runs the API (`serve`) and the worker (`worker`). The contract is `../docs/api/openapi.yaml`.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
pytest
ruff check .
DATABASE_URL=postgresql://radar:change-me@localhost:5432/radar uvicorn app.main:app --reload
```

Layout: `app/routers` (one file per contract tag), `app/services` (scoring, validator, search), `app/collectors`
(API, crawl, document), `app/worker.py` (scheduled jobs), `migrations/` (plain SQL, applied in order).
