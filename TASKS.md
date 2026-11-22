# Tasks: Pomysłownik! (team ft_marvins)

> **All tasks which are complete according to teammate files or other places should be marked with strikethrough** (`| ~~ID~~ | ~~Task~~ **Done: Name** |`) - {Philip Organisational Decision}

> Research notes and the translated task files are kept outside this repository. Ask Delta if you need them.


Written 2026-11-21 17:30 CET. Deadline as told by Delta: **2026-11-22 11:00**. Plan: `PLAN.md`. Requirement IDs (F1 to F20): `REQUIREMENTS.md`.
Contract: `docs/api/openapi.yaml`. Frontend start guide: `docs/FRONTEND-START.md`.

**Status 2026-11-22 00:05:** done items are struck through. M0 to M3 are reached.
- **Backend:** complete, merged into `main` (PRs #4, #5) and live: API `https://demo.delta43.net` on delta-server, which tracks `main`. Only B10 (optional) is open.
- **Frontend on `main`** (PR #6): landing page `/` with the new logo and hero video (Alban), plus Philip's sign-in, search, results, card and profile pages. Newer frontend work (F0 screens, F1, PL/EN switch, F2 filter fix) is on branch `Philip`, not yet in `main`.
- **Production web** `https://pomyslownik.delta43.net` still serves the old scaffold page and cannot reach the API. It needs a rebuild on delta-server from `main`, with `NEXT_PUBLIC_API_BASE_URL=https://demo.delta43.net`.
- **Research:** 25 seed cards on `main` (27 live with collected ones). The next batch (R4) and corrections are on branch `research/seed-cards-r1-r2`. Research now: Karrie and Andrei.

**Status 2026-11-22 02:50: mentor feedback.** Ten points from the mentor review are now tasks in the section **"Mentor feedback (M)"** below (IDs B13 to B18, F12 to F20, D1, D2, R11, R12, P10, Q4).
Findings and decisions: `docs/MENTOR-FEEDBACK-2026-11-22.md`. Contract draft 3 (`1.1.0-draft.3`) is on branch `docs/mentor-feedback-2026-11-22`; it is additive, and the live API passes the contract test against it.
Priority before the 06:30 feature freeze: **B15 + F13** (Ukrainian, chosen by the server), **F15 + F16** (WCAG 2.2 and ARIA fixes), **D1 + F17** (PCI colours), **B17 + F20** (related work on the card). The real login.gov.pl adapter (B14) is after the hackathon, and the pitch says so.

**Status 2026-11-22, after PR #29 (merged 04:07): checked by Alban** against `main`, the open branches and the live servers.
- **Production web** `https://pomyslownik.delta43.net` now serves the real landing page. The scaffold blocker above is fixed. The live API `/health` still reports `version: 1.0.0-draft.2`. Delta: check whether the server runs PR #29 (B15, B17, B18) or the version string is just not bumped.
- **Done but not merged:**
  - `feat/b16-registry-licence` (PR #30): B16, EUPL-1.2 `LICENSE`, README. `main` has no `LICENSE` yet, and the submission needs one.
  - `research/r7-r8-task-status`: R3 showcases, R8 methodology text, R7 questions, R4/R6/R9 closed. It merges into `main` without conflicts.
  - `Philip` (8 commits): Roboto Cyrillic fallback (part of F13), motion flow, search bar, landing tweaks, and a palette change (see D1).
- **Palette decision needed before F17 or merging `Philip`.** `Philip` commit `ed6a4e6` makes Granat `#0085CC` the colour for buttons, links and focus. That is 3.61:1 on Papier and 4.02:1 with white, below the 4.5:1 WCAG AA needs for normal text. D1 asks for PCI Navy `#001A49` and Deep blue `#035487` as main colours, with `#0085CC` → `#6BB437` as decoration only.
- **"Now" tasks with no sign in the code on `main`:** F13 (no `messages/uk.json`, no `Accept-Language`), F15 (`scroll-padding-top` only on the landing page), F16 (no `aria-expanded`), D1, F17, F19, F20, R11.
- **Not started:** F5 to F10, Q1 to Q4, S1 to S5. Slides, video and submission text were planned for 08:00.
- **No tasks claimed yet:** Andrei, Karrie and Przemek have nothing in their `team/` files. Research work is on the research branch under "Slimalke".
- **Suggested order:** merge PR #30 (`LICENSE`) and the research branch, decide the palette, then F15, F16 and F19 before the freeze, then slides and video.

## Tracks

Tasks have no fixed owner here. To take a task, add its ID to your own file in `team/` and mark it `[~]`. Ownership and progress live in those files.

| Track | Task IDs | Notes |
|---|---|---|
| Platform and containers | P1 to P9 | Compose, Dockerfiles, deployment, CI, repository hygiene |
| Backend | B1 to B12 | API, database, scoring, collectors, refresh. All done and live except B10 (optional) |
| Research and verification | R1 to R10 | Manual review. Curates and verifies seed data and every "confirmed" field |
| Frontend | F0 to F11 | Three developers. F0 first, then F11, F1/F2, F3/F4 and F5 to F8 in parallel |
| QA, slides, video | Q1 to Q4, S1 to S5 | Starts once the demo path exists |
| Mentor feedback (2026-11-22) | C3, B13 to B18, F12 to F20, D1, D2, R11, R12, P10, Q4 | Ten mentor points. Tiers Now, Should, After. See the section "Mentor feedback (M)" |

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
| ~~P7~~ | ~~CI: contract lint, image builds, licence scan~~ **Done: Delta** (frontend image build fixed in PR #6: Alban) | P2, P3 | 1 h | Pull request checks pass. Licence scan lists no incompatible dependency | rules §4 |
| P8 | Repository hygiene. Status 00:05: README replaced and `.env` ignored. Left: no `LICENSE` file on `main` yet, `frontend/AGENTS.md` is an AI file (re-created by `next dev`), no data-protection note | — | 1 h | Stale README replaced. `LICENSE` is EUPL-1.2. No AI files in the repo. `.env` ignored. Data-protection note added | F17 |
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
| R3 | **Two deep use cases** chosen and fully documented: one technological (patent or research), one educational or administrative (page plus PDF) **Status 22.11 (Slimalke): waiting for review and implementation by Delta.** Both showcases are written and verified (bone substitute by Politechnika Warszawska + BoneReg; e-Doręczenia): `research/03-r3-showcases.md` and #15 | R1 | 2 h | Each has 3 or more sources, quoted passages and a note on where the confirmed facts come from | task §6 |
| ~~R4~~ | ~~**Seed set, grow to 40 to 60 cards** across the three areas. Status 00:05: 25 seed cards on `main` (27 live); batch 1 notes and card fixes on branch `research/seed-cards-r1-r2`~~ **Closed: Slimalke. 27 good cards is enough.** | R2 | 5 h | Cards cover all areas. Several different regions of Poland. At least 10 with Polish IP | F1, F2, F19 |
| R5 | **Verify.** A second look at every "confirmed" field: the source says it. Mark wrong ones. Status 00:05: Karrie's first corrections applied by Delta (four cards corrected). **Status 22.11 (Slimalke): waiting for review and implementation by Delta.** All 24 seed cards and the 3 collector cards reviewed by Claude and checked by hand; corrections in #9, #12, #13, #22 | R2, R4 | continuous | No card has a "confirmed" field the source does not support. A list of corrections sent to the backend developer | F14 |
| ~~R6~~ | ~~Read the Technology Transfer Platform (PTT, run by ARP, not PFR; ptt.arp.pl is reachable and crawlable) in a browser and write 10 lines: what it lists, who posts, what is missing~~ **Closed: Slimalke. Not necessary.** | — | 0.5 h | Note in `research/`. Changes the pitch wording if needed | — |
| R7 | **Ask the mentors:** (1) Does the FAQ govern where it differs from the earlier talk (no submission form, login optional, no introductions)? (2) Are early stages such as concept and prototype wanted? (3) Their own definitions and weights for the five criteria. (4) Two real examples for the demo. (5) Sources that must not be crawled. (6) Is the Polish-IP goal about patents only? (7) What would PCI do with anonymous usage numbers? | — | 1 h | Answers written down, with the mentor's role and the time asked | F8–F12 |
| R8 | Methodology text (plain Polish and English): the five criteria and how each is computed | R7 | 1.5 h | Reviewed by the backend developer. Used on the methodology page | F8–F12 |
| ~~R9~~ | ~~Regional context numbers: three or four GUS BDL indicators per region, as evidence rows~~ **Closed: Slimalke. Not possible, hence not important.** | R1 | 1.5 h | CSV or JSON of indicator, value, unit, year, source | F11 |
| ~~R10~~ | ~~Register the OpenAlex key (free) and hand it to the backend developer through a safe channel~~ **Done: Delta** | — | 0.2 h | Key is in the backend `.env`. Not in chat logs or git | F5 |

## Frontend (F)

Start now, on the mock. Switch to the real API at M1 (done, and in `main` since PR #6).

**Landing page (agreed flow, first screen): done: Alban.** `/` in the Next.js app, on `main` since PR #6: Blender renders and hero video, new logo (bulb and otter symbol as the "!" of "Pomysłownik!"), sign-in panel linking to `/logowanie`, aligned with `DESIGN.md`, no navbar.

**Agreed flow (design team, 23:00):** landing with graphics and logo on the left and the sign-in panel on the right; after sign-in the window slides open to the search screen (nav bar on top, search bar, latest tags as chips under it); results with filters and sort in a left column and collapsed cards with a short summary; a click expands a card in place with the full details, still scrollable. This replaces the home layout in F1 and the separate sign-in page in F11. Mockups and review: see the design agent's report. Follow `docs/FRONTEND-START.md` (states to design, accessibility checklist, generated types).

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| ~~F0~~ | ~~**Scaffold:** Next.js, TypeScript, Tailwind, i18n (Polish first, English toggle), design tokens, typed API client from the contract, layout with skip link, error and loading components~~ **Done: Delta, Philip** (Philip's i18n and error/loading screens are on branch `Philip`) | — | 2 h | App runs with `docker compose --profile mock up` plus `npm run dev`. Types generated. Other frontend tasks can start from it | F20 |
| ~~F1~~ | ~~**Home:** search box, six audience presets, overview numbers, "how it works" strip~~ **Done: Philip** (on branch `Philip`, not yet in `main`) | F0 | 2 h | Preset sets filters and goes to results. Overview numbers come from `/stats/overview` | F4, F18, F20 |
| ~~F2~~ | ~~**Results:** list, filters from `/facets`, sort, pagination, active filter chips, select cards for compare~~ **Done: Philip** (on branch `Philip`, not yet in `main`. The compare button opens `/porownaj?ids=id1,id2`, which is F4) | F0 | 3 h | Every filter works with keyboard. Empty, loading and error states designed | F15 |
| ~~F3~~ | ~~**Card page:** description, area, implementation level, TRL, scores with confidence, **Confirmed and Estimate labels**, sources with quoted passages, evidence drawer, similar cards, history, link to the owner. Status 00:05 (Philip, in progress). Left: similar cards, history, evidence drawer (the endpoints are live now)~~ **Done: Philip** | F0 | 4 h | A number never appears without a source link or a "not enough data" note. Labels do not rely on colour alone | F13, F14 |
| ~~F4~~ | ~~**Compare:** two to four cards side by side from `/compare`, best value marked in text~~ **Done: Philip** | F3 | 2 h | Table has proper headers. Works at phone width | F15 |
| F5 | **Insights page:** usage trends and database effectiveness (cards, freshness, confirmed share) | F0 | 2 h | Shows `/stats/usage` and `/stats/overview`. Text version of any chart | F16, F18 |
| F6 | **Admin demo page:** token input, start a refresh, show run status and changed cards | F0 | 2 h | Token is typed in, never stored in the bundle. Works with the mock | F7 |
| F7 | **Pages:** methodology (definitions, the fact/estimate rule, limits, data sources), Oslo definition, **terms of use (IP misuse ban)**, accessibility statement, privacy notice, about | R8 | 2 h | Text from the research track. Linked in the footer. Honest about limits | F3, F14, F17 |
| F8 | **Usage events:** background `POST /events` for search, view, compare, filter | F2, F3 | 1 h | Never blocks the screen. No free text sent | F16 |
| F9 | **Accessibility pass:** automated checks (axe), keyboard-only run, 200% zoom, 400% reflow at 320 px, one screen reader on the demo path, in each contrast mode. Runs after F15 and F16 | F1–F4, F15, F16 | 2 h | No serious axe issues. Demo path works by keyboard. Results go into the accessibility statement (F7) | WCAG, M3, M4 |
| F10 | **Copy and translation check** of every screen in Polish, English and Ukrainian | F1–F8, F13 | 1 h | No mixed-language screens in any of the three languages | F20, M2 |
| F11 | **Sign-in and registration:** provider choice (sandbox labelled "test identity"), registration with role, affiliation, interests, terms and privacy notice, session handling (httpOnly cookie via the Next.js server), redirect to sign-in on 401, profile page with role change and account deletion. Every card page is behind sign-in. Status 00:05 (Philip, in progress): everything works on the live API. Left: keyboard check, role sets the default preset | F0 | 3 h | No card data is visible without a session. Role sets the default preset. Works by keyboard | F4, F17 |

## Mentor feedback (M), added 2026-11-22

Source: mentor review, points 1 to 10. Requirement IDs M1 to M10 (`REQUIREMENTS.md`). Details per point: `docs/MENTOR-FEEDBACK-2026-11-22.md` (§ numbers below).
**Tier:** **Now** = before the 06:30 feature freeze. **Should** = before the freeze if time allows, else after. **After** = after the hackathon; describe it in the slides and pitch.

| ID | Task | Tier | Depends | Est | Done when | Req |
|---|---|---|---|---|---|---|
| ~~C3~~ | ~~**Contract draft 3.** Review and merge `docs/api/openapi.yaml` 1.1.0-draft.3 (language negotiation, auth redirect flow, `relatedWork`, admin source config). Backend owner and one frontend developer agree~~ **Done: Delta, reviewed by Philip (#25, follow-ups #26)** | Now | — | 0.5 h | Merged. Lint valid. Contract test passes on the live API (it does on the branch) | M1, M2, M8, M9 |
| ~~C4~~ | ~~**Contract draft 4.** Philip's follow-ups (#26), drift fixes, design hardening of the redirect flow (PKCE, exact `returnTo` origin), and the known-gaps register G1 to G9 (`docs/api/CONTRACT-REVIEW.md` §0b). Philip reviews before merge~~ **Done: Delta, approved by Philip (#27)** | Now | C3 | 0.5 h | Merged after Philip's approval. Lint valid. Live contract test passes (it does on the branch) | M1, M2 |
| ~~B15~~ | ~~**Server-side language.** Read `lang` and `Accept-Language` (lang wins, then `preferredLanguage`, then `pl`). Return each `LocalizedText` as one string when a language is named. `Content-Language` and `Vary: Accept-Language`. Error messages in that language. Add `uk` to every label table (`services/i18n.py`: areas, levels, regions, units, source prefixes, licences, yes/no). Translate stored card texts to `uk` once (Claude, at ingest and as a backfill) and list them in `machineTranslated`. Language rule and CI check extend to `uk`~~ **Done: Delta (PR #29)** | Now | C3 | 3 h | `GET /cards?lang=uk` returns only Ukrainian strings. Same call with `Accept-Language: en` returns English. Contract test passes in all three languages. No card lacks `uk` | M2, M10 |
| F13 | **Frontend in three languages.** Send `Accept-Language` from the locale cookie on every API call. Remove the object branch of `pick()`. Add `messages/uk.json` and "Українська" to the switch (`lang="uk"` on the name). `DATE_LOCALE` `uk-UA`. Load Roboto with the Cyrillic subset and add it to every font stack (Lato and Atkinson have no Cyrillic). Show the machine-translation note | Now | B15 | 2 h | Every screen is 100% Ukrainian when `uk` is chosen, with no system-font fallback. No `{pl, en}` object is read in the frontend | M2, M10 |
| R12 | Review the Ukrainian texts on the demo path (labels, UI words, the cards shown in the demo). A Ukrainian speaker if the team has one; else mark them as machine translation | Should | F13 | 1 h | Demo path read through. Corrections sent to the backend owner | M2 |
| F14 | **Display settings.** Text size (100, 125, 150%), contrast mode (standard, high, low), kept in a cookie and rendered by the server. Follow `prefers-contrast` and `forced-colors`. High contrast: solid surfaces, no glass blur, 2 px borders, underlined links | Should | D1 | 2 h | Each mode passes 4.5:1 for text. Works by keyboard. No flash of the wrong theme | M3 |
| F15 | **WCAG 2.2 fixes** (§3): `scroll-padding-top` under the sticky app header (2.4.11), 24 px minimum targets (2.5.8), solid search focus ring (1.4.11), help link in the same footer place (3.2.6), paste allowed and no puzzle at sign-in (3.3.8). Test 200% text and 320 CSS px width | Now | — | 1.5 h | Each item checked on the demo path and noted in the accessibility statement | M3 |
| F16 | **ARIA pass** (§4): disclosure buttons with `aria-expanded` for cards that expand in place, named `nav` landmarks, `fieldset`/`legend` for filters, live result count, labelled search input, `lang` on language names, focus to `h1` after navigation | Now | — | 1.5 h | axe shows no serious issues. A screen reader (NVDA or VoiceOver) completes the demo path | M4 |
| D1 | **PCI and Podkarpackie palette** (§5). Update `DESIGN.md` and `tokens.css`: PCI Navy `#001A49`, Deep blue `#035487`, Mist surfaces, Podkarpackie green `#027641` for success, blue-to-green band `#0085CC` → `#6BB437` as decoration. Check every pair for contrast. Simulate colour blindness on the category colours. **Open question (2026-11-22):** branch `Philip` uses `#0085CC` as the main colour instead, which fails 4.5:1 for text (see the status note at the top) | Now | — | 1 h | Token table with contrast numbers merged. Alban agrees | M5, M3 |
| F17 | Apply D1 tokens in `globals.css` and components. Replace Papier backgrounds, Granat buttons and links | Now | D1 | 1 h | No old hex value left in `frontend/src`. axe contrast check passes | M5 |
| D2 | **Type scale and layout** (§6): one fluid scale (ratio 1.25, `clamp()`), body 17 px, line length 60 to 75 characters, one primary action per screen, glass blur only on the landing art | Should | D1 | 1 h | `DESIGN.md` §3 and §4 updated | M6 |
| F18 | Apply D2 on the app pages (search, results, card, compare) | Should | D2 | 1.5 h | Headings follow the scale on phone and desktop. Results readable at 320 px | M6, M7 |
| F19 | **Ease of use**: three actions from the landing page to the first card; role sets the default preset (F11 leftover); every empty state and error says the next step; "TRL" explained on first use | Now | — | 1 h | Counted on the live site: three actions or fewer | M7, F18 |
| Q4 | Usability test with three people who have not seen the app: "Find an educational innovation in Podkarpackie and compare two." Time and stumbles written down | Should | F19 | 1 h | Notes in `research/`. Numbers go to Q3 and the slides | M7, F18 |
| ~~B17~~ | ~~**Related work on the card** (§8): store similar catalogue cards and external hits (OpenAlex works, RAD-on projects, PTT listings) in `relatedWork` during collect and refresh, with organisation, region, public contact page, similarity and shared tags. Numbers from code, not the model~~ **Done: Delta (PR #29)** | Now | C3 | 2 h | A demo card shows at least three related items from two kinds. Contract test passes | M8, F10 |
| F20 | Card section "Who else works on this", grouped by organisation, with links to public contact pages. Marked as estimate. No messaging, no user-to-user matching | Now | B17 | 1.5 h | Shows on the card page in all languages. Works by keyboard | M8 |
| R11 | **Ask the mentor** (follow-up to R7): (1) does `relatedWork` plus PCI-made introductions (with `consentToContact`) stay inside FAQ §6? (2) Is PCI the right party to sign the login.gov.pl applications? Also confirm on `int.login.gov.pl` that mObywatel is offered to private services | Now | — | 0.5 h | Answers written down with the time asked | M1, M8 |
| B16 | **Source registry** (§9): read `data/sources/registry.json` (format in `registry.example.json`), tokens by `tokenEnv` from the environment, a generic API adapter with a JSONPath mapping, a feed (RSS/Atom) and sitemap reader. `GET /admin/source-config` shows readiness and `tokenPresent`, never the value. `targets.json` keeps working until it is migrated | Should | C3 | 3 h | A new API source is added by editing the registry and `.env` only, with no code change. Admin endpoint passes the contract test | M9, F5, F6 |
| P10 | Document the registry and the new variables in `README.md` and `.env.example` (variables done on the branch). Mount key files for sign-in as secrets, never in the image | Should | B16 | 0.5 h | A teammate adds a source from the README alone | M9 |
| ~~B18~~ | ~~**Backend owns all labels** (§10): `/facets` also returns labels for selected values with zero results, so `/wyniki` never shows a raw slug. Optional: send evidence rows inline with each assessed field~~ **Done: Delta (PR #29)** | Now | — | 0.5 h | No `{pl: v, en: v}` fallback left in the frontend | M10 |
| B13 | **Provider interface and redirect flow** with the sandbox as a fake redirect provider: `/auth/{provider}/start`, `/redirect`, `/auth/exchange`, PKCE (`codeChallenge` S256 / `codeVerifier`), exact-origin `returnTo` check, single-use state and ticket, registration ticket, HMAC subject with `IDENTITY_PEPPER`, `assuranceLevel`. The direct sandbox calls stay | Should | C3 | 2.5 h | The sandbox signs in through the redirect flow end to end. Contract test covers it | M1 |
| F12 | Sign-in page lists providers from `/auth/providers` with their `methods` (Profil Zaufany, mObywatel, e-dowód, bank) and starts the redirect flow; registration form takes the ticket and prefills the name. The web server keeps the PKCE verifier in an httpOnly cookie and the ticket server-side. Logout handles `204` and `200` + `redirectUrl` (single logout). The `returnTo` page sends `Referrer-Policy: no-referrer` | Should | B13 | 1.5 h | Works with the sandbox redirect provider. login.gov.pl shows as "coming" | M1 |
| B14 | **Węzeł Krajowy adapter** (login.gov.pl, `SPType=private`): `pysaml2` with HTTP-Artifact, `ArtifactResolve` over SOAP, EC keys, separate signing and decryption keys, LoA `substantial`, single logout. Integration environment first | After | B13, R11 | 3 days + onboarding | Sign-in with Profil Zaufany works on `int.login.gov.pl` | M1 |
| B19 | **Known gaps G1 to G9** (`docs/api/CONTRACT-REVIEW.md` §0b): sandbox allow-list and `403` on shared demo identities (with a picker on the sign-in page), language and cache headers, `http(s)`-only links and plain text at ingest, admin rate limit, usage-stats period rules, input limits, trusted address only from the tunnel. Each fix is small. No rework | After | C4 | 3 h total | Each G row has a test or a note. Contract markers `(planned, Gn)` removed | M10, F17 |

## QA, slides, video (Q, S)

| ID | Task | Depends | Est | Done when | Req |
|---|---|---|---|---|---|
| Q1 | End-to-end test of the demo path (Playwright) | M2 | 2 h | One test runs: search, open card, compare, refresh shows a status change | F15, F7 |
| Q2 | Demo script (timed) and rehearsal | M3 | 1 h | Script fits 3 minutes. Run twice with the stack on delta-server | task §6 |
| Q3 | Effectiveness numbers for the pitch: steps and seconds to find a solution, source coverage, freshness | M3 | 1 h | Numbers measured, not guessed. Method written down | F18 |
| S1 | Slides, at most 10, PDF: problem, definition, how it works, card, assessment, sources and limits, demo, effectiveness, scale and next steps, team. **Next steps slide:** national login through login.gov.pl (mObywatel, Profil Zaufany), Ukrainian, source registry, PCI colours | M3 | 3 h | PDF under 10 slides. Facts match the app. Nothing on the slides claims a feature that is not built | task §4, M1 |
| S2 | Video, at most 3 minutes, uploaded to an open repository, link in the submission | Q2 | 2 h | Plays without login. Shows the demo path | task §4 |
| S3 | Submission text: title, problem, solution, how it works, main functions | M3 | 1 h | Matches the app and slides | task §4 |
| S4 | Pitch (5 minutes) for stage II | S1 | 1 h | Rehearsed once. Uses the same demo | rules §2 |
| S5 | Final repository check: licence, README, no secrets, build from a clean clone. **Last step before the 10:30 submission: remove `team/`, `PLAN.md` and `TASKS.md`** (they stay until then) (and `REQUIREMENTS.md` unless the team keeps it) | P8 | 1 h | Those files are gone from `main`. A teammate builds from a fresh clone | rules §4 |

---

## Critical path

`R1 → R2 → B3 → B12 → (frontend on real API) → B4 → B5 → B6 → B7 → Q1 → S2`

The things that block others most: **B3** (frontend), **R2** (backend seed) and **F0** (all frontend). Do these first.

Mentor feedback path (until the 06:30 freeze): `C3 → B15 → F13` (languages), `C3 → B17 → F20` (related work), `D1 → F17` (colours), with `F15`, `F16`, `F19` and `B18` in parallel. Then `F9` re-runs on the result.

## Open decisions (see `PLAN.md` §10)

Decided: backend in Python and FastAPI; tunnel hosts `demo.delta43.net` (API) and `pomyslownik.delta43.net` (web); similarity uses trigram plus shared tags (embeddings optional, B10); the Claude key is set on the server.
Decided 2026-11-22 (mentor feedback): the server picks the response language (`pl`, `en`, `uk`); the national login comes through the Węzeł Krajowy only, with no SMS codes of our own and no PESEL stored; similarity and research hits are stored on the card (`relatedWork`); sources are configured in one registry file with tokens in `.env`.
Still open: the Claude key's spending limit, the two use cases (R3), whether `relatedWork` plus PCI-made introductions fit FAQ §6 (R11), and who signs the login.gov.pl applications (R11).
