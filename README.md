# Pomysłownik!

Team **ft_marvins**, Hacknation 2026, challenge "Radar Innowacji" (Innovation Radar) by Podkarpackie Centrum Innowacji (PCI).

A web app that automatically collects existing Polish innovations from open sources, assesses each one, and shows
it on a clear card with its sources. Every value is marked as a confirmed fact or an estimate. Search, filter and compare
cards by area (technological, educational, administrative) and by audience.

## Status

Work in progress for the hackathon. The description below is the plan. See `docs/api/openapi.yaml` for the API contract.

## Run it

```bash
cp .env.example .env              # set your own values
docker compose --profile mock up  # mock API on http://localhost:4010 (frontend work)
docker compose --profile full up --build   # whole stack: web :3000, API :8000
```

## Add a data source

Sources live in one file, `data/sources/registry.json`. Copy `data/sources/registry.example.json` to start. Tokens never go in that file.

1. Add an entry to `sources`. Set `method` to `api`, `feed` (RSS or Atom), `sitemap` or `crawl`.
2. For an API, set `baseUrl`, `itemsPath` (where the list is, for example `$.results`) and `mapping` (at least `title` and `url`, as JSONPath).
3. If the source needs a token, put the variable name in `tokenEnv` (for example `MY_SOURCE_TOKEN`) and the value in `.env`.
4. Set `enabled` to `true` only after you check the source's licence and terms.
5. Check readiness: `GET /api/v1/admin/source-config` with the admin token. It shows `tokenPresent`, never the token.

The next collect run reads the new source. Crawling always obeys `robots.txt` and its `Crawl-delay`.

## Languages

The API answers in the language the request names (`?lang=pl|en|uk` or `Accept-Language`). Ukrainian texts are machine
translations made by the worker. After a deploy, run `docker compose ... run --rm api python -m app.translate --backfill` once.

## Layout

| Folder | Content |
|---|---|
| `backend/` | FastAPI API and worker (collectors, scoring, refresh) |
| `frontend/` | Next.js web app |
| `docs/api/` | OpenAPI contract and its review |
| `data/seed/` | Curated seed cards (JSON, contract format) |
| `scripts/` | Smoke test |

## Licence

EUPL-1.2. See `LICENSE` (official text from the European Commission's Joinup site).
