# Backend

FastAPI. One image runs the API (`serve`) and the worker (`worker`). The contract is `../docs/api/openapi.yaml`.

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements-dev.txt
ruff check . && pytest            # CI runs both; the tests need DATABASE_URL (a PostgreSQL with pgvector)
DATABASE_URL=postgresql://radar:change-me@localhost:5432/radar uvicorn app.main:app --reload
python -m app.seed                # migrations already applied: starter cards, OpenAlex evidence, scores, related work
python -m app.translate --backfill  # Ukrainian machine translations (needs ANTHROPIC_API_KEY)
```

Layout: `app/routers` (one file per contract tag), `app/services` (cards, search, scoring, validator, languages),
`app/collectors` (API, crawl, PDF, polite fetching with robots.txt and an SSRF guard), `app/registry.py` (configurable sources),
`app/pipeline.py` and `app/worker.py` (collect and refresh runs, translation queue), `migrations/` (plain SQL, applied in order).
Settings: `../.env.example`.
