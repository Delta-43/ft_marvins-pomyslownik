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

## Layout

| Folder | Content |
|---|---|
| `backend/` | FastAPI API and worker (collectors, scoring, refresh) |
| `frontend/` | Next.js web app |
| `docs/api/` | OpenAPI contract and its review |
| `data/seed/` | Curated seed cards (JSON, contract format) |
| `scripts/` | Smoke test |

## Licence

EUPL-1.2. See `LICENSE` (to be added before submission).
