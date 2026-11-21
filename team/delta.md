# Delta

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [x] **B1** API skeleton
- [x] **B2** Database schema and migrations
- [x] **B3** Seed loader and read endpoints
- [x] **B4** Search (typo tolerant), compare, similar, history
- [x] **B5** Scoring engine and number validator
- [x] **B6a** API collectors: RAD-on projects (cards), OpenAlex (evidence)
- [x] **B6b** Crawler: PTT listings, generic pages (robots, Crawl-delay, snapshots, AI extraction with quotes)
- [x] **B6c** PDF reports (new card or enrich a card)
- [x] **B6d** Oslo check (three flags and pass, on every extracted card)
- [x] **B7** Refresh runs and worker (scheduled every 24 h, status history, stale flag, single flight)
- [x] **B8** Usage events and usage stats
- [x] **B9** Admin token and Idempotency-Key
- [x] **B11** Contract test against the API (`backend/tests/test_contract.py`, also against the live server)
- [x] **B12** Sign-in
- [ ] **B10** Embeddings similarity (optional; trigram plus shared tags works now)
- [x] **P2/P3/P4/P5** Images build, whole stack runs, deployed on delta-server (`/data/projects/hacknation/ft_marvins-pomyslownik`)
- [x] **R1/R2** Source check and first 24 seed cards. Research track handed to Karrie and Andrei (Polish natives)

## Doing now

Backend complete and live. Waiting for decisions: Karrie's seed corrections, polishIpStatus contract field.

## Blockers

- Polish IP: patent numbers stated by sources are not verified, because the UPRP register needs a working e-Profil key (ours returns 401). `polishIp` stays false until verified.
- Scoring weights are indicative. Mentors' definitions (R7) would replace them.
- For Philip (fixed 22:40): sign-in rate limit is now 300/min per address plus 10/min per identity, so the web server no longer hits it. `/compare`, `/cards/{id}/similar`, `/cards/{id}/history`, `/events` and `/stats/usage` are live. New optional fields: `methodText`, `Evidence.label`, `Source.passageLang`, `CountItem.label`, `StatusChange.fromLabel/toLabel`, `CollectRun.changedCardIds`; compare cells' `display` is now `{pl, en}`.

## Log

| Time | Update |
|---|---|
| 2026-11-21 20:30 | B1 done (config reads root .env, tests pass). Starting B2. |
| 2026-11-21 21:00 | B2 done: `002_core.sql` applies on pgvector/pg16, idempotent, single-flight index and accent-free search checked. |
| 2026-11-21 21:30 | Took over the Research track too. 3 real technological cards in `data/seed/cards/`, pending Karrie's check. |
| 2026-11-21 22:00 | B3 done: seed loader, cards, card, facets, audiences, sources, overview. 10 real cards loaded. R2 done, R5 (verification) pending with Karrie. |
| 2026-11-21 22:10 | Backend live: API https://demo.delta43.net (→ delta-server 192.168.0.43:8000), web https://pomyslownik.delta43.net (→ :3010). 10 real cards seeded. Branch `backend/b3-b12-scaffold` pushed. Karrie's first review: research articles correct, stories summarised correctly. |
| 2026-11-21 22:26 | Live on delta-server: B4, B5, B8 (earlier this evening), then B6a-d, B7, B11: collectors (PTT, RAD-on, PDF, OpenAlex), refresh worker every 24 h, contract test. Language rule enforced (every user-visible text in Polish and English). Claude and OpenAlex keys set in the server .env. Earlier log times are approximate. |
| 2026-11-21 22:43 | Code review (10 findings) fixed and live: re-seed keeps events, history and attached PDFs; collectors remember skipped sources; rate limit no longer trusts X-Forwarded-For; register/admin races handled. 72 tests pass; contract test passes against the live server for all 27 cards. |
