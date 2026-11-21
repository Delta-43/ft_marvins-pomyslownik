# Innovation Radar: build plan (v4)

> Research notes and the translated task files are kept outside this repository. Ask Delta if you need them.


Written 2026-11-21 17:30 CET. Deadline as told by Delta: **2026-11-22 11:00** (about 17 hours). Confirm the official deadline on hacknation.pl.
Work items are in `TASKS.md`. Requirements (F1 to F20) are in `REQUIREMENTS.md`. The API is `docs/api/openapi.yaml`.
Earlier versions: `archive/`. Research: `research/01` to `04`. Evidence tags: **S** search summary, **V** tested live, **R** our reasoning, **?** not read.

## 1. The product

**Innovation Radar** is a public web app that **automatically collects existing Polish innovations** from open sources, turns each into one **innovation card**, **assesses** it, and lets anyone **search, filter and compare** cards. It refreshes on a schedule.

The organisers' FAQ governs (`task_files/en/03-faq-clarification.md`):
- Three areas: **technological, educational, administrative**. Definition from the Oslo Manual 2018.
- Collection by **API, crawling and AI on documents**. Scheduled refresh.
- Assessment: implementation level (concept, prototype, tests, pilot, in practice), TRL 1 to 9 (technology only), innovativeness, application potential, credibility.
- Every field is a **confirmed fact (with source)** or an **estimate (with method)**.
- **Not built:** idea submission, social features, crowdfunding, financing, investor search.
- Login is optional and not planned. Analytics are anonymous.

To confirm with a mentor: that the FAQ governs where it differs from the earlier mentor talk (catalogue of proposals, verified login, introductions).

## 2. Key building points

These are the points that decide the score. Everything else is secondary.

1. **One end-to-end path that works:** a source item goes in, a card with scores comes out, you find it by search, compare it, and a refresh changes its status. Jury criterion: prototype quality.
2. **The fact/estimate rule.** The model never produces a number. Plain code computes scores from stored evidence rows (metric, value, unit, source, query, date). A validator rejects text with a number that is not in the evidence. With no data the card says "not enough data".
3. **Three collection methods, shown:** an API adapter, a web crawler, and document (PDF) extraction with AI. At least one real example of each.
4. **Cards in all three areas** and **two deep use cases** (one technological, one educational or administrative).
5. **Public, simple assessment.** Five criteria with plain definitions on a methodology page. Scores show confidence.
6. **Scheduled refresh** with status-change detection and a "stale" flag, plus a button to trigger it in the demo.
7. **Search, filter, compare** with six audience presets.
8. **Accessible interface** (WCAG 2.2 AA, tested) and Polish first.
9. **Effectiveness numbers** the demo can show: time to find a solution, source coverage, freshness.
10. **Runs from containers**, staged here and deployed on delta-server.

## 3. Architecture

```
  Browser ──► web (Next.js) ──► api (REST, openapi.yaml) ──► db (PostgreSQL + pgvector)
                                   ▲                              ▲
                                   │                              │
                              worker (collectors, scoring, refresh schedule) ──► Claude API
                                   │
                              public sources (APIs, web pages, PDFs)
```

| Container | Role | Notes |
|---|---|---|
| `web` | Frontend | Next.js, TypeScript. Calls the API from the browser (`NEXT_PUBLIC_API_BASE_URL`) and from the server (`API_BASE_URL_INTERNAL`) |
| `api` | REST API | Implements the contract. Reads the database. Starts runs by writing a job. Backend owner: Delta |
| `worker` | Collectors, scoring, refresh | Same image as `api`, different command. Scheduled loop plus on-demand runs |
| `db` | Storage and search | PostgreSQL with pgvector. Full text and trigram search |
| `mock` | Frontend helper | Prism serving the contract. Profile `mock` only |

**Contract first.** `docs/api/openapi.yaml` is the single source. The frontend builds on the mock and generated types. The backend implements and tests against the contract. Reviewed in `docs/api/CONTRACT-REVIEW.md`.

**Environments**

| | Staging (this machine) | Production (delta-server) |
|---|---|---|
| Command | `docker compose --profile full up --build` | `docker compose -f compose.yaml -f compose.prod.yaml --profile full up -d --build` |
| Ports | Published on localhost | Bound to `127.0.0.1` only. The tunnel exposes the API (and the web app if served there) |
| Secrets | `.env`, never committed | `.env` on the server, never committed |
| Data | Seed files, `make seed` | Same seed, then live collectors |

Deployment steps use the `managing-ssh-mesh` skill (cross-host work, `delta-server` alias). The tunnel host name is not decided yet. Set `CORS_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL` once it is.

## 4. Assessment (definitions to validate with a mentor)

| Criterion | Output | How it is computed |
|---|---|---|
| Implementation level | concept, prototype, testing, pilot, in practice | Rules over extracted signals. The model proposes, the rules confirm, evidence listed |
| TRL | 1 to 9, or not applicable | Mapped from the same signals. Technology only |
| Innovativeness | 0 to 100 plus confidence | Distance to similar records, counts of similar patents and papers |
| Application potential | 0 to 100 plus confidence, and "could also be used in" | Documentation, dependence on local context, sectors in similar records |
| Credibility | 0 to 100 plus confidence | Number of independent and official sources, confirmation of implementation |

Weights are not final. Every score is labelled indicative and links to its evidence.

## 5. Sources (live checks in `research/03`)

| Method | Examples | Status |
|---|---|---|
| API | OpenAlex (needs a free key), EU Funding and Tenders, data.europa.eu, GUS BDL for regional numbers | Work without or with a free key (V) |
| Crawl | Incubators, transfer centres, university, school and council pages | To build. Check robots and terms first |
| Document | PDF reports and project descriptions | To build |
| Unreliable today | UPRP, RSPO, KRS (maintenance page) | Seed by hand. Cache |

Do not scrape Google Scholar (no official API). Use OpenAlex and say so in the pitch. The demo runs from the cache. Karrie verifies sources and every "confirmed" field in the seed set.

## 6. Priorities and cut order

| Tier | Items |
|---|---|
| **Must** | Items 1 to 9 of §2. Contract, containers and deployment |
| **Should** | Anonymous analytics page, Polish-IP view, second live API source |
| **Could** | Saved searches, embeddings-based similarity (trigram fallback first), optional login |
| **Do not build** | Idea submission, community, crowdfunding, financing, introductions, real login.gov.pl, own model training |

**Cut order if late:** embeddings similarity, saved searches, Polish-IP view, analytics page, the second crawler, then the second use case depth.
**Solo backend risk:** one person builds the API, scoring and collectors. The seed set (Karrie) and the mock (frontend) keep the others unblocked. The backend order is fixed: seeded API first, then search, then scoring, then collectors, then refresh.

## 7. Stack

- **Frontend:** Next.js, TypeScript, Tailwind, accessible primitives (Radix or React Aria), Polish and English, types generated from the contract.
- **Backend (proposed, to confirm):** Python and FastAPI, one image for `api` and `worker`. Collectors with `httpx`, an HTML parser and PDF text extraction. Claude for structured extraction and explanations. Scheduled loop in the worker.
- **Database:** PostgreSQL with pgvector, `pg_trgm`, `unaccent`. No built-in Polish stemmer (R, check early).
- **Licences:** the repo is released under EUPL-1.2, so every dependency must be MIT, BSD, Apache-2.0 or EUPL-compatible. Check with a licence scan in CI. Check the licence of the embedding model and any Bielik model before use.

## 8. Demo and deliverables

Demo (task steps a to e), two use cases: (1) a technological item from an API plus patent, (2) an educational or administrative item from a crawled page and a PDF. Show: collect, card with fact/estimate labels, filter by audience, compare, a refresh that changes a status, effectiveness numbers.

Required: title, problem and solution text, how it works, **PDF with at most 10 slides**, **video of at most 3 minutes** in an open repository. Optional: code, demo link, screenshots. Release under **EUPL-1.2**. The top three teams give a 5-minute pitch.

## 9. Risks

| Risk | Response |
|---|---|
| One backend developer for 17 hours | Fixed build order, seed-first, mock for the frontend, cut order in §6 |
| Poor extraction on Polish pages | Test on three real pages in the first three hours. Curated fallback set |
| Sources down | Cache. Demo from cache |
| Hallucinated facts | Facts only with stored passage and URL. Number validator |
| Crawling terms | Respect robots. Low rate. Stored snapshots. Prefer APIs |
| Tunnel or CORS trouble on the day | Test the tunnel in the first hours, not at the end. Keep a localhost fallback for the demo |
| Over-building excluded features | The FAQ exclusion list gates every feature |
| Accessibility claimed but untested | Automated and manual checks. Honest statement |
| PFR platform already covers part of this | Read it first. Position on automatic collection, assessment, freshness |

## 10. Decisions needed now

1. Who is the third frontend developer (the message named Przemek twice)?
2. Backend language: Python and FastAPI as proposed, or TypeScript?
3. Claude API key for extraction and explanations: whose, and the spending limit?
4. Tunnel host name and whether the web app is also served from delta-server.
5. Which embedding model, or skip embeddings and use trigram similarity only?
6. Which two use cases?

## 11. Not yet verified

- Official deadline and the final jury criteria text.
- PFR Technology Transfer Platform (HTTP 403).
- Terms and robots rules per crawled site.
- Licences: embedding model, Kohesio export, Lens.org, EEN keyword codes.
- Whether `pgvector/pgvector:pg16` pulls and runs here (not pulled yet).
