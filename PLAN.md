# Pomysłownik!: build plan (v4, status updated 2026-11-21 23:11)

> Research notes and the translated task files are kept outside this repository. Ask Delta if you need them.


Written 2026-11-21 17:30 CET. Deadline as told by Delta: **2026-11-22 11:00** (about 17 hours). Confirm the official deadline on hacknation.pl.
Work items are in `TASKS.md`. Task ownership is tracked in `team/`. `team/`, `PLAN.md` and `TASKS.md` stay in the repo until the final step, and are removed just before the 10:30 submission. Requirements (F1 to F20) are in `REQUIREMENTS.md`. The API is `docs/api/openapi.yaml`.
Earlier versions: `archive/`. Research: `research/01` to `04`. Evidence tags: **S** search summary, **V** tested live, **R** our reasoning, **?** not read.

## 1. The product

**Pomysłownik!** (working name earlier: Innovation Radar) is a public web app that **automatically collects existing Polish innovations** from open sources, turns each into one **innovation card**, **assesses** it, and lets anyone **search, filter and compare** cards. It refreshes on a schedule.

The organisers' FAQ governs (`task_files/en/03-faq-clarification.md`):
- Three areas: **technological, educational, administrative**. Definition from the Oslo Manual 2018.
- Collection by **API, crawling and AI on documents**. Scheduled refresh.
- Assessment: implementation level (concept, prototype, tests, pilot, in practice), TRL 1 to 9 (technology only), innovativeness, application potential, credibility.
- Every field is a **confirmed fact (with source)** or an **estimate (with method)**.
- **Not built:** idea submission, social features, crowdfunding, financing, investor search.
- **Everyone signs in and selects a role** (one of the six audiences) before seeing any card. This deters misuse of the intellectual property on the cards. The demo uses a clearly labelled sandbox identity. The real national login (login.gov.pl, SAML) is documented as the next step. Usage statistics are aggregated by role.
- **Mentor review (2026-11-22)** added ten points: national login as a drop-in (mObywatel, Profil Zaufany), Ukrainian chosen by the server, WCAG 2.2 and ARIA, PCI and Podkarpackie colours, clearer hierarchy, ease of use, related work kept on the card, a source registry, and a strict frontend/backend split. See §12.

To confirm with a mentor: that the FAQ governs where it differs from the earlier mentor talk (catalogue of proposals, introductions). Required sign-in is the team's decision. The FAQ does not forbid it and asks for GDPR compliance.

## 2. Key building points

These are the points that decide the score. Everything else is secondary.

1. **One end-to-end path that works:** a source item goes in, a card with scores comes out, you find it by search, compare it, and a refresh changes its status. Jury criterion: prototype quality.
2. **The fact/estimate rule.** The model never produces a number. Plain code computes scores from stored evidence rows (metric, value, unit, source, query, date). A validator rejects text with a number that is not in the evidence. With no data the card says "not enough data".
3. **Three collection methods, shown:** an API adapter, a web crawler, and document (PDF) extraction with AI. At least one real example of each.
4. **Cards in all three areas** and **two deep use cases** (one technological, one educational or administrative).
5. **Public, simple assessment.** Five criteria with plain definitions on a methodology page. Scores show confidence.
6. **Scheduled refresh** with status-change detection and a "stale" flag, plus a button to trigger it in the demo.
7. **Sign-in with a role**, then **search, filter, compare**. The role sets the default audience preset.
8. **Accessible interface** (WCAG 2.2 AA, tested) and Polish first.
9. **Effectiveness numbers** the demo can show: time to find a solution, source coverage, freshness.
10. **Runs from containers**, staged here and deployed on delta-server.
11. **Three languages, chosen by the server** (Polish, English, Ukrainian). The frontend renders strings only.
12. **"Who else works on this"** on every card: similar cards and research hits with organisations and public contact pages.
13. **Easy to use:** three actions from the landing page to the first card. PCI and Podkarpackie colours.

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
| Ports | Published on localhost | Bound to the LAN address 192.168.0.43 (`API_BIND`, `WEB_BIND`), API on 8000, web on 3010 (Gitea uses 3000). Cloudflare tunnel: `demo.delta43.net` → API, `pomyslownik.delta43.net` → web |
| Secrets | `.env`, never committed | `.env` on the server, never committed |
| Data | Seed files, `make seed` | Same seed, then live collectors |

Deployment steps use the `managing-ssh-mesh` skill (cross-host work, `delta-server` alias). ~~The tunnel host name is not decided yet.~~ Decided and live: see Ports. The checkout on delta-server is `/data/projects/hacknation/ft_marvins-pomyslownik`.

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
| API | RAD-on open data (research projects → cards, no key), OpenAlex (counts of similar Polish works → innovativeness evidence, key), UPRP statistics API (aggregates, no key), GUS BDL, dane.gov.pl | Live and tested (V). Checks in `research/01-sources.md` |
| Crawl | PTT, the technology transfer platform of ARP (robots allow, Crawl-delay 5); gov.pl, city and university pages | Live (V). Robots and Crawl-delay respected, snapshots cached |
| Document | PDF reports (new card, or enrich a card) | Live (V): the 2022 evaluation report of "Szkoła dla innowatora" |
| Not used | PW repository and PPM (robots Disallow /), PBN (institution token), CORDIS search (robots), UPRP e-Wyszukiwarka (our key returns 401) | Seed by hand only |

Do not scrape Google Scholar (no official API). Use OpenAlex and say so in the pitch. The demo runs from the cache. Karrie verifies sources and every "confirmed" field in the seed set.

## 6. Priorities and cut order

| Tier | Items |
|---|---|
| **Must** | Items 1 to 13 of §2. Sign-in with role and terms (sandbox identity). Contract, containers and deployment. Mentor "Now" tasks: C3, B15, F13, F15, F16, D1, F17, B17, F20, F19, B18, R11 |
| **Should** | Anonymous analytics page, Polish-IP view, second live API source. Mentor "Should" tasks: B13, F12, B16, P10, F14, D2, F18, Q4, R12 |
| **Could** | Saved searches, embeddings-based similarity (trigram fallback first) |
| **After the hackathon** | Real login.gov.pl adapter (B14): needs signed applications to the Ministry of Digital Affairs. Designed and in the contract now |
| **Do not build** | Idea submission, community, crowdfunding, financing, introductions inside the app, own SMS sign-in codes, storing the PESEL, own model training |

**Cut order if late:** embeddings similarity, saved searches, Polish-IP view, analytics page, the second crawler, the second use case depth, then the mentor "Should" tasks in this order: F14, F18, D2, B16, B13 and F12. Never cut B15 + F13, F15, F16 or B17 + F20 without telling the mentor.
**Solo backend risk:** one person builds the API, scoring and collectors. The seed set (Karrie) and the mock (frontend) keep the others unblocked. The backend order is fixed: seeded API first, then search, then scoring, then collectors, then refresh.

## 7. Stack

- **Frontend:** Next.js, TypeScript, Tailwind, accessible primitives (Radix or React Aria), Polish and English, types generated from the contract.
- **Backend (built):** Python and FastAPI, one image for `api` and `worker`. Collectors with `httpx`, selectolax (lexbor) and pypdf. Claude (`claude-opus-5-5`, structured output, server-side refusal fallbacks) for extraction only; explanations are templates, numbers come from evidence. Scheduled refresh every 24 h in the worker.
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
| Sign-in friction for the jury | One-click sandbox identities in the demo. Explain why: protecting IP |
| Personal data from sign-in (email, affiliation) | Privacy notice, retention period, account deletion. No national ID number stored |
| Sandbox mistaken for verification | Label it "test identity" everywhere. `identityVerified` is false |
| Accessibility claimed but untested | Automated and manual checks. Honest statement |
| PFR platform already covers part of this | Read it first. Position on automatic collection, assessment, freshness |

## 10. Decisions needed now

1. ~~Backend language: Python and FastAPI as proposed, or TypeScript?~~ Python and FastAPI.
2. ~~Claude API key for extraction and explanations: whose~~ Delta's key, on the server. Spending limit: still to set.
3. ~~Tunnel host name and whether the web app is also served from delta-server.~~ `demo.delta43.net` (API) and `pomyslownik.delta43.net` (web), both from delta-server.
4. ~~Which embedding model, or skip embeddings and use trigram similarity only?~~ Trigram plus shared tags for now; embeddings (B10) optional.
5. Which two use cases? Candidates: technological "Lab-on-a-Foil" (Politechnika Warszawska, PTT listing with application P.441974, OpenAlex evidence); educational "Szkoła dla innowatora" (gov.pl page plus the 2022 evaluation PDF).

## 11. Not yet verified

- Official deadline and the final jury criteria text.
- ~~PFR Technology Transfer Platform (HTTP 403).~~ It is PTT, run by ARP; readable and crawlable.
- Terms and robots rules per crawled site. Robots: checked for every site we crawl. Terms and licences: still unknown for PTT and RAD-on.
- Licences: embedding model, Kohesio export, Lens.org, EEN keyword codes.
- ~~Whether `pgvector/pgvector:pg16` pulls and runs here (not pulled yet).~~ Runs here and on delta-server.
- Whether the mObywatel app is offered on login.gov.pl to private services (`SPType=private`), and whether integration is free (R11).

## 12. Mentor review, 2026-11-22

Full findings: `docs/MENTOR-FEEDBACK-2026-11-22.md`. Login research: `docs/api/AUTH-PROVIDERS.md`. Requirements M1 to M10: `REQUIREMENTS.md`. Tasks: `TASKS.md`, section "Mentor feedback (M)".

| Point | Decision |
|---|---|
| National login | One provider interface. The Węzeł Krajowy (login.gov.pl) carries mObywatel, Profil Zaufany with its SMS step, e-dowód and bank login. SAML 2.0 with HTTP-Artifact. We store an HMAC of the identity, never the PESEL, and no phone numbers. Real adapter after the hackathon |
| Ukrainian | `lang` or `Accept-Language` picks the language on the server. Each text is one string. `uk` stored for every text, machine translations marked. Roboto added for Cyrillic |
| Accessibility | WCAG 2.2 AA including the six new criteria. Text-size and contrast modes. ARIA by the Authoring Practices |
| Colours and type | PCI Navy and Deep blue, Mist surfaces, Podkarpackie green, blue-to-green band. One fluid type scale like the PCI site. Lato stays for headings |
| Ease of use | Three actions to the first card. Usability test with three people |
| Connecting people | `relatedWork` on the card: who else works on this, with public contact pages. No messaging, no matching, so FAQ §6 holds. Mentor to confirm |
| Sources | `data/sources/registry.json` with `tokenEnv`. Tokens only in `.env`. Admin readiness endpoint |
| Frontend and backend | The backend does all processing, language choice and labels. The frontend renders and keeps view state only |

**Architecture change:** the language now travels with each request (`Accept-Language` from the web server to the API), and the API response varies by it (`Vary: Accept-Language`). Nothing else in §3 changes.
