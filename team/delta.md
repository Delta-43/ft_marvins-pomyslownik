# Delta

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [x] **B1** API skeleton
- [x] **B2** Database schema and migrations
- [x] **B3** Seed loader and read endpoints
- [x] **B12** Sign-in
- [x] **B9** Admin token and Idempotency-Key (token check, idempotent start, single flight)
- [x] **P2/P3/P4/P5** Images build, whole stack runs, deployed on delta-server (`/data/projects/hacknation/ft_marvins-pomyslownik`)
- [ ] **B4** Search ranking, compare, similar
- [ ] **B5** Scoring engine and validator
- [~] **R1** Source list and rules check (draft in `research/01-sources.md`)
- [x] **R2** Seed set, first 10 cards (10 written, awaiting Karrie's verification, see R5)

## Doing now

B4 search, compare and similar, next.

## Blockers

- Not live yet (404): `/compare`, `/cards/{id}/similar`, `/cards/{id}/history`, `/events`, `/stats/usage` (B4, B7, B8). Workers (B7) and collectors (B6) are stubs.
- Scores are all `insufficientData` until B5.

## Log

| Time | Update |
|---|---|
| 2026-11-21 20:30 | B1 done (config reads root .env, tests pass). Starting B2. |
| 2026-11-21 23:00 | Backend live: API https://demo.delta43.net (→ delta-server 192.168.0.43:8000), web https://pomyslownik.delta43.net (→ :3010). 10 real cards seeded. Branch `backend/b3-b12-scaffold` pushed. Karrie's first review: research articles correct, stories summarised correctly. |
| 2026-11-21 22:00 | B3 done: seed loader, cards, card, facets, audiences, sources, overview. 10 real cards loaded. R2 done, R5 (verification) pending with Karrie. |
| 2026-11-21 21:30 | Took over the Research track too. 3 real technological cards in `data/seed/cards/`, pending Karrie's check. |
| 2026-11-21 21:00 | B2 done: `002_core.sql` applies on pgvector/pg16, idempotent, single-flight index and accent-free search checked. |
