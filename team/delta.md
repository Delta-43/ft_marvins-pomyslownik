# Delta

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [x] **B1** API skeleton
- [x] **B2** Database schema and migrations
- [x] **B3** Seed loader and read endpoints
- [ ] **B12** Sign-in
- [~] **R1** Source list and rules check (draft in `research/01-sources.md`)
- [x] **R2** Seed set, first 10 cards (10 written, awaiting Karrie's verification, see R5)

## Doing now

B4 search and compare, since 2026-11-21 ~22:00.

## Blockers

_None._

## Log

| Time | Update |
|---|---|
| 2026-11-21 20:30 | B1 done (config reads root .env, tests pass). Starting B2. |
| 2026-11-21 22:00 | B3 done: seed loader, cards, card, facets, audiences, sources, overview. 10 real cards loaded. R2 done, R5 (verification) pending with Karrie. |
| 2026-11-21 21:30 | Took over the Research track too. 3 real technological cards in `data/seed/cards/`, pending Karrie's check. |
| 2026-11-21 21:00 | B2 done: `002_core.sql` applies on pgvector/pg16, idempotent, single-flight index and accent-free search checked. |
