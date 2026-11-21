# Tasks: Pomysłownik! (team ft_marvins)

> **All tasks which are complete according to teammate files or other places should be marked with strikethrough** (`| ~~ID~~ | ~~Task~~ **Done: Name** |`) - {Philip Organisational Decision}

> Research notes and the translated task files are kept outside this repository. Ask Delta if you need them.


Written 2026-11-21 17:30 CET. Deadline as told by Delta: **2026-11-22 11:00**. Plan: `PLAN.md`. Requirement IDs (F1 to F20): `REQUIREMENTS.md`.
Contract: `docs/api/openapi.yaml`. Frontend start guide: `docs/FRONTEND-START.md`.

**Status 2026-11-21 23:11:** done items are struck through. The backend is complete and live (API `https://demo.delta43.net`, web `https://pomyslownik.delta43.net`, both on delta-server). Latest backend and contract: branch `backend/b3-b12-scaffold`, not yet merged into `main`. M0 to M3 are reached. Research now: Karrie and Andrei.

## Tracks

Tasks have no fixed owner here. To take a task, add its ID to your own file in `team/` and mark it `[~]`. Ownership and progress live in those files.

| Track | Task IDs | Notes |
|---|---|---|
| Platform and containers | P1 to P9 | Compose, Dockerfiles, deployment, CI, repository hygiene |
| Backend | B1 to B12 | API, database, scoring, collectors, refresh. All done and live except B10 (optional) |
| Research and verification | R1 to R10 | Manual review. Curates and verifies seed data and every "confirmed" field |
| Frontend | F0 to F11 | Three developers. F0 first, then F11, F1/F2, F3/F4 and F5 to F8 in parallel |
| QA, slides, video | Q1 to Q3, S1 to S5 | Starts once the demo path exists |

## Working rules

1. **Claim tasks in `team/`.** Add the task ID to your own file and mark it `[~]`. Mark `[x]` when done. Then strike the task through in this file with **Done: Name** (see the note at the top).
2. **Contract first.** Change `openapi.yaml` in a pull request. The backend owner and a frontend developer agree before merge. Lint it with `docker run --rm -v "$PWD/docs/api":/spec -w /spec redocly/cli lint openapi.yaml`.
3. **No secrets in git.** The repo becomes public. Use `.env` (ignored). Never paste API keys in chat or commits.
4. **Sign-in first.** No card data on any page or endpoint without a session.
5. **Licences.** Every dependency must be MIT, BSD, Apache-2.0 or EUPL-compatible. No proprietary fonts, images, data or models.
6. **Excluded features** (FAQ section 6): no idea submission, no social features, no crowdfunding, no financing, no investor matching. Do not build them, even small.
7. **Branches and pull requests** into `main` of `ft_marvins-pomyslownik`. Small pull requests. One reviewer. Do not wait long for review.
8. **Definition of done** for any task: it works in the staging containers, it meets its "done when" line, accessibility basics hold (frontend), and the contract has not drifted.

## Milestones (clock times)

| Time | Milestone | Gate |
|---|---|---|
| ~~18:30~~ | ~~**M0 Kickoff done**~~ | Contract merged. Mock runs. Frontend scaffold started. Seed format agreed. Dockerfiles stubbed |
| ~~22:00~~ | ~~**M1 Real API on seed data**~~ | `api` serves cards, card detail, facets, audiences, sources, overview from seed. Frontend runs on staging against it |
| ~~01:30~~ | ~~**M2 Search, compare, scores**~~ | Search and filters, compare, scoring with evidence. First deploy on delta-server with the tunnel working |
| ~~04:30~~ | ~~**M3 Collectors and refresh**~~ | API, crawl and PDF collectors. Refresh with status change. Admin run endpoint |
| 06:30 | **Feature freeze** | Only fixes after this |
| 08:00 | Video and slides | Recording and deck |
| 10:00 | Final checks | Licence, README, clean repo, submit |
| 10:30 | **Submit** | Before the deadline, not at it |

Sleep in shifts after M2. Two people stay awake at any time.

---

## Platform and containers (P)

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| ~~P1~~ | ~~Compose files, env example, mock profile~~ **Done: Delta** | — | — | **Done.** `compose.yaml`, `compose.prod.yaml`, `.env.example`. `docker compose --profile mock up` serves the mock (tested) | — |
| ~~P2~~ | ~~Backend Dockerfile (multi-stage, non-root, healthcheck that matches the base image)~~ **Done: Delta** | B1 | 0.5 h | `docker compose --profile full build api` succeeds. `/health` returns 200 in the container | — |
| ~~P3~~ | ~~Frontend Dockerfile (Next.js standalone build, build arg for the API URL)~~ **Done: Delta** | F0 | 0.5 h | `docker compose --profile full build web` succeeds. Page loads on port 3000 | — |
| ~~P4~~ | ~~Staging: whole stack up on this machine~~ **Done: Delta** | P2, P3 | 0.5 h | `docker compose --profile full up --build` starts db, api, worker, web. Frontend shows seed cards | — |
| ~~P5~~ | ~~Deploy to delta-server and tunnel~~ **Done: Delta** | P4 | 1 h | Same stack runs on delta-server with `compose.prod.yaml`. Tunnel reaches the API. Browser on another network loads the site with no CORS errors. Use the `managing-ssh-mesh` skill for host work | F20 |
| ~~P6~~ | ~~Smoke test script~~ **Done: Delta** | P4 | 0.5 h | One command checks `/health`, a search, a card, CORS and the admin 401. Run it after every deploy | — |
| P7 | CI: contract lint, image builds, licence scan | P2, P3 | 1 h | Pull request checks pass. Licence scan lists no incompatible dependency | rules §4 |
| P8 | Repository hygiene | — | 1 h | Stale README replaced. `LICENSE` is EUPL-1.2. No AI files in the repo. `.env` ignored. Data-protection note added | F17 |
| ~~P9~~ | ~~Reproducible data: `make seed` or one command loads seed into a fresh database~~ **Done: Delta** | B3 | 0.5 h | A fresh clone plus one command gives a populated app | F20 |

## Backend (B)

Fixed order: B1 → B2 → B3 → B4 → B5 → B6 → B7. Do not start B6 before B3 is deployed, so the frontend is never blocked.

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| ~~B1~~ | ~~API skeleton: FastAPI app, config, error envelope, request ids, CORS from `CORS_ORIGINS`, `/health`~~ **Done: Delta** | — | 1 h | Matches `Error` shape in the contract. `/health` reports database state | F20 |
| ~~B2~~ | ~~Database schema and migrations: cards, organisations, tags, sources, evidence, status history, events, collect runs, with vector and trigram columns~~ **Done: Delta** | B1 | 1.5 h | Migrations run on an empty database in the container. Tables map to the contract fields | F1, F7 |
| ~~B3~~ | ~~Seed loader and read endpoints (behind sign-in once B12 exists; until then accept any token): `cards`, `cards/{id}`, `facets`, `audiences`, `sources`, `stats/overview` from seed files. **Unblocks the frontend**~~ **Done: Delta** | B2, R2 | 2.5 h | Responses validate against the contract. Frontend can use the real API | F13, F15, F20 |
| ~~B4~~ | ~~Search: full text, trigram, filters, sort, pagination. `compare`. `similar` (trigram first)~~ **Done: Delta** | B3 | 2.5 h | `GET /cards?q=…&area=…` filters and sorts correctly. Polish text with and without diacritics matches (`unaccent`). Compare returns aligned rows | F10, F15 |
| ~~B5~~ | ~~Scoring engine and validator: implementation level, TRL, innovativeness, application potential, credibility, confidence. Every number from evidence rows~~ **Done: Delta** | B3 | 3 h | Same input gives same scores. A card with no evidence returns `insufficientData: true`. Validator rejects a model text containing a number not in the evidence (unit test) | F8–F12, F14 |
| ~~B6a~~ | ~~Collector: API adapter (OpenAlex, with key) producing cards and evidence~~ **Done: Delta** Built as: RAD-on API produces cards (no key), OpenAlex adds evidence for innovativeness | B5 | 2 h | One real item becomes a card with sources and evidence | F5, F6 |
| ~~B6b~~ | ~~Collector: web crawler with robots check, rate limit, snapshots, HTML to text, AI extraction with the source passage~~ **Done: Delta** | B5 | 3 h | One real school, council or transfer-centre page becomes a card. Every extracted field stores the quoted passage | F5, F6 |
| ~~B6c~~ | ~~Collector: PDF text extraction and AI extraction~~ **Done: Delta** | B6b | 1.5 h | One real report PDF becomes a card or enriches one | F6 |
| ~~B6d~~ | ~~Oslo inclusion check~~ **Done: Delta** | B6b | 0.5 h | Each card has the three Oslo flags and a pass or fail | F3 |
| ~~B7~~ | ~~Refresh job and runs: scheduled loop, recheck known cards, status history, stale flag, `admin/collect-runs` with idempotency key and single-flight (`run_in_progress`)~~ **Done: Delta** | B6a | 2 h | A refresh changes one card's status and writes history. A repeated request with the same key returns the same run | F7 |
| ~~B8~~ | ~~Events and usage stats: `POST /events` (dedupe by `eventId`), `GET /stats/usage`, hide counts under 5, rate limit~~ **Done: Delta** | B3 | 1 h | No free text, no IP stored. Duplicate event stored once | F16, F17 |
| ~~B9~~ | ~~Admin token and `Idempotency-Key` handling~~ **Done: Delta** | B7 | 0.5 h | Missing token returns 401. Wrong token returns 403 | task §5 |
| B10 | Embeddings similarity (optional) | B4 | 2 h | `similar` uses embeddings. Skip if behind schedule | F10 |
| ~~B11~~ | ~~Contract test against the running API (schemathesis or similar)~~ **Done: Delta** | B3 | 1 h | Run in CI or by hand. No schema violations on the read endpoints | — |
| ~~B12~~ | ~~**Sign-in:** `auth/providers`, `register`, `login`, `logout`, `me` (get, patch, delete), session tokens with expiry, sandbox provider with a few demo identities, terms check, every protected route returns 401 without a session, rate limit on register and login~~ **Done: Delta** | B1, B2 | 2.5 h | Contract tests pass for the Auth tag. No card endpoint answers without a session. Deleting an account removes its personal data | F17 |

## Research and verification (R)

Research output goes straight into the app, so the format matters. The seed format is the `Card` schema in `openapi.yaml` (see `components.examples.CardDetail`). One JSON file per card in `data/seed/cards/`.

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| ~~R1~~ | ~~**Source list and rules check.** For each source we plan to use: URL, access method (API, crawl, document), licence or terms, robots rules, key needed~~ **Done: Delta** | — | 2 h | A table in `research/` with a go or no-go per source. Crawl only sources marked go | F5, rules §4 |
| ~~R2~~ | ~~**Seed set, first 10 cards** (3 technological, 4 educational, 3 administrative) in the contract format, with source URLs and quoted passages~~ **Done: Delta** | R1 | 3 h | Valid JSON that passes the contract schema. The backend can load it. Due by 21:00 | F2, F13 |
| R3 | **Two deep use cases** chosen and fully documented: one technological (patent or research), one educational or administrative (page plus PDF) | R1 | 2 h | Each has 3 or more sources, quoted passages and a note on where the confirmed facts come from | task §6 |
| R4 | **Seed set, grow to 40 to 60 cards** across the three areas | R2 | 5 h | Cards cover all areas. Several different regions of Poland. At least 10 with Polish IP | F1, F2, F19 |
| R5 | **Verify.** A second look at every "confirmed" field: the source says it. Mark wrong ones | R2, R4 | continuous | No card has a "confirmed" field the source does not support. A list of corrections sent to the backend developer | F14 |
| R6 | Read the Technology Transfer Platform (PTT, run by ARP, not PFR; ptt.arp.pl is reachable and crawlable) in a browser and write 10 lines: what it lists, who posts, what is missing | — | 0.5 h | Note in `research/`. Changes the pitch wording if needed | — |
| R7 | **Ask the mentors:** (1) Does the FAQ govern where it differs from the earlier talk (no submission form, login optional, no introductions)? (2) Are early stages such as concept and prototype wanted? (3) Their own definitions and weights for the five criteria. (4) Two real examples for the demo. (5) Sources that must not be crawled. (6) Is the Polish-IP goal about patents only? (7) What would PCI do with anonymous usage numbers? | — | 1 h | Answers written down, with the mentor's role and the time asked | F8–F12 |
| R8 | Methodology text (plain Polish and English): the five criteria and how each is computed | R7 | 1.5 h | Reviewed by the backend developer. Used on the methodology page | F8–F12 |
| R9 | Regional context numbers: three or four GUS BDL indicators per region, as evidence rows | R1 | 1.5 h | CSV or JSON of indicator, value, unit, year, source | F11 |
| ~~R10~~ | ~~Register the OpenAlex key (free) and hand it to the backend developer through a safe channel~~ **Done: Delta** | — | 0.2 h | Key is in the backend `.env`. Not in chat logs or git | F5 |

## Frontend (F)

Start now, on the mock. Switch to the real API at M1 (done on branch `Philip`).

**Agreed flow (design team, 23:00):** landing with graphics and logo on the left and the sign-in panel on the right; after sign-in the window slides open to the search screen (nav bar on top, search bar, latest tags as chips under it); results with filters and sort in a left column and collapsed cards with a short summary; a click expands a card in place with the full details, still scrollable. This replaces the home layout in F1 and the separate sign-in page in F11. Mockups and review: see the design agent's report. Follow `docs/FRONTEND-START.md` (states to design, accessibility checklist, generated types).

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| ~~F0~~ | ~~**Scaffold:** Next.js, TypeScript, Tailwind, i18n (Polish first, English toggle), design tokens, typed API client from the contract, layout with skip link, error and loading components~~ **Done: Delta, Philip** | — | 2 h | App runs with `docker compose --profile mock up` plus `npm run dev`. Types generated. Other frontend tasks can start from it | F20 |
| ~~F1~~ | ~~**Home:** search box, six audience presets, overview numbers, "how it works" strip~~ **Done: Philip** | F0 | 2 h | Preset sets filters and goes to results. Overview numbers come from `/stats/overview` | F4, F18, F20 |
| F2 | **Results:** list, filters from `/facets`, sort, pagination, active filter chips, select cards for compare | F0 | 3 h | Every filter works with keyboard. Empty, loading and error states designed | F15 |
| F3 | **Card page:** description, area, implementation level, TRL, scores with confidence, **Confirmed and Estimate labels**, sources with quoted passages, evidence drawer, similar cards, history, link to the owner | F0 | 4 h | A number never appears without a source link or a "not enough data" note. Labels do not rely on colour alone | F13, F14 |
| F4 | **Compare:** two to four cards side by side from `/compare`, best value marked in text | F3 | 2 h | Table has proper headers. Works at phone width | F15 |
| F5 | **Insights page:** usage trends and database effectiveness (cards, freshness, confirmed share) | F0 | 2 h | Shows `/stats/usage` and `/stats/overview`. Text version of any chart | F16, F18 |
| F6 | **Admin demo page:** token input, start a refresh, show run status and changed cards | F0 | 2 h | Token is typed in, never stored in the bundle. Works with the mock | F7 |
| F7 | **Pages:** methodology (definitions, the fact/estimate rule, limits, data sources), Oslo definition, **terms of use (IP misuse ban)**, accessibility statement, privacy notice, about | R8 | 2 h | Text from the research track. Linked in the footer. Honest about limits | F3, F14, F17 |
| F8 | **Usage events:** background `POST /events` for search, view, compare, filter | F2, F3 | 1 h | Never blocks the screen. No free text sent | F16 |
| F9 | **Accessibility pass:** automated checks (axe), keyboard-only run, 200% zoom, one screen reader on the demo path | F1–F4 | 2 h | No serious axe issues. Demo path works by keyboard | WCAG |
| F10 | **Polish copy and translation check** of every screen | F1–F8 | 1 h | No mixed-language screens | F20 |
| F11 | **Sign-in and registration:** provider choice (sandbox labelled "test identity"), registration with role, affiliation, interests, terms and privacy notice, session handling (httpOnly cookie via the Next.js server), redirect to sign-in on 401, profile page with role change and account deletion. Every card page is behind sign-in | F0 | 3 h | No card data is visible without a session. Role sets the default preset. Works by keyboard | F4, F17 |

## QA, slides, video (Q, S)

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| Q1 | End-to-end test of the demo path (Playwright) | M2 | 2 h | One test runs: search, open card, compare, refresh shows a status change | F15, F7 |
| Q2 | Demo script (timed) and rehearsal | M3 | 1 h | Script fits 3 minutes. Run twice with the stack on delta-server | task §6 |
| Q3 | Effectiveness numbers for the pitch: steps and seconds to find a solution, source coverage, freshness | M3 | 1 h | Numbers measured, not guessed. Method written down | F18 |
| S1 | Slides, at most 10, PDF: problem, definition, how it works, card, assessment, sources and limits, demo, effectiveness, scale and next steps, team | M3 | 3 h | PDF under 10 slides. Facts match the app | task §4 |
| S2 | Video, at most 3 minutes, uploaded to an open repository, link in the submission | Q2 | 2 h | Plays without login. Shows the demo path | task §4 |
| S3 | Submission text: title, problem, solution, how it works, main functions | M3 | 1 h | Matches the app and slides | task §4 |
| S4 | Pitch (5 minutes) for stage II | S1 | 1 h | Rehearsed once. Uses the same demo | rules §2 |
| S5 | Final repository check: licence, README, no secrets, build from a clean clone. **Last step before the 10:30 submission: remove `team/`, `PLAN.md` and `TASKS.md`** (they stay until then) (and `REQUIREMENTS.md` unless the team keeps it) | P8 | 1 h | Those files are gone from `main`. A teammate builds from a fresh clone | rules §4 |

---

## Critical path

`R1 → R2 → B3 → B12 → (frontend on real API) → B4 → B5 → B6 → B7 → Q1 → S2`

The things that block others most: **B3** (frontend), **R2** (backend seed) and **F0** (all frontend). Do these first.

## Open decisions (see `PLAN.md` §10)

Backend language, Claude API key owner and limit, tunnel host name, embeddings or trigram only, and the two use cases.
