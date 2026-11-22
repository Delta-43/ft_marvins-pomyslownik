# Contract review: Innovation Radar API v1 (draft 1)

Date: 2026-11-21. Method: the ten design checks of the `api-contract-review` skill (Mozurok/fhorja.dev), applied by hand to `openapi.yaml` before any backend code exists. The review is by the author of the draft, so it is a self-review. A second reader from the team should check it.

**Grounding.** Statements below rest on command output seen during this review: the Redocly CLI lint of `openapi.yaml` (valid, 3 warnings), a running Prism 5 mock (200, 400, 401, 404, 429 responses, CORS header), `openapi-typescript` 7.13.0 type generation (1,368 lines, all operations present), and `docker compose config` for both compose files. Items marked `[ungrounded: ...]` were not run.

## 0c. Revision: draft 5, version 1.1.0-draft.5 (2026-11-22, issues #17 and #18)

- `Evidence.origin` (`source` | `computed`) and `Evidence.queryText` (`LocalizedText`), both optional. Computed rows are shown apart and without a source link (Philip's option 1 in #18). `sourceId` stays a required string, so generated types do not change.
- `StatusChange.field` documents the Polish IP values in `other` (`polish_ip_unknown`, `polish_ip_stated`, `polish_ip_confirmed`). Every reviewer correction that changes the level, TRL or Polish IP status now writes a history row (#17).
- **Built in the backend (branch `feat/b15-b17-b18`):** B15 server-side language (`lang`, `Accept-Language`, `preferredLanguage`; strings in the named language; Ukrainian from a machine-translation table filled by the worker, `machineTranslated` on cards; translated error messages), B17 `relatedWork` stored on every card (similar catalogue cards and OpenAlex works by Polish institutions, no person names), B18 selected facet values always returned with labels. **G2 closed:** `Content-Language`, `Vary: Accept-Language` and `Cache-Control: private, no-store` on authenticated responses.
- **G1 partly closed:** the shared demo identities (`DEMO_IDENTITIES`, default `demo-jury`) are listed in `/auth/providers` (`demoIdentities`), skip the per-identity sign-in limit (a jury shares one identity), and `DELETE /me` on them returns `403`. Free sandbox subjects are still accepted; the allow-list for production stays in B19.

## 0b. Revision: draft 4, version 1.1.0-draft.4 (2026-11-22, review of #25 and full pass)

**Inputs:** Philip's review of #25 (issue #26), then a full read of the contract against the backend routers (`backend/app/routers/*`, `security.py`) and the frontend sign-in (`frontend/src/app/actions/auth.ts`).
**Scope decision (Delta):** draft 4 documents the gaps as known unknowns. It does not ask for heavy rework. Every new rule the live API does not follow yet is marked `(planned, Gn)` in the contract.

**Issue #26 (Philip), all five points:**
1. No language named: card texts keep the object form; only error `message` and `Content-Language` fall back to `preferredLanguage`, then `pl`.
2. `RegisterRequest` now has a machine-checked `oneOf`: the sandbox branch (`provider: sandbox_id` + `providerSubject`) or the redirect branch (`login_gov_pl` / `mojeid` + `registrationTicket`). Each branch forbids the other field. Lint stays clean.
3. `Content-Language` and `Vary` are declared (`components/headers`) on 24 JSON success responses.
4. `RelatedWork.title` is a plain string in the work's own language, with `titleLang` (ISO 639-1), like `passageLang`.
5. Examples use one form (string) everywhere. `q` matches Ukrainian too. Logout `200` + `redirectUrl` is described, and F12 handles it.

**Drift fixed:** `/auth/logout` needs a session (the overview said all `/auth/*` is public). The live server is listed (`https://demo.delta43.net`). `similar` said "embeddings", but it uses trigram plus shared tags. "Polish and English" wording on six label fields now says "the negotiated language". `POST /events` advised `navigator.sendBeacon`, which cannot send the bearer token; the web server sends events. `/facets` always returns selected values with labels (B18). Partial `{en: …}` maps in the examples are gone. `passageLang` accepts any two-letter code.

**Hardening in the design (not live, part of B13 and B14):** the redirect flow now uses PKCE (`codeChallenge` S256 on `/start`, `codeVerifier` on `/exchange`), so a leaked code is useless and login CSRF fails. `returnTo` needs an exact origin match (a prefix check would accept `https://pomyslownik.delta43.net.evil.example`). The SAML checks are listed (signature, `InResponseTo`, audience, time window, one use per artifact and state). OIDC uses PKCE and `nonce`. Registration tickets are single use and tied to their provider. Exchange errors are identical, so they reveal nothing.

### Known gaps register (G1 to G9)

Not enforced by the live API. Each fix is small. None is needed for the demo. Task **B19** collects them for after the hackathon.

| ID | Gap (verified in code) | Risk | Light fix | Est |
|---|---|---|---|---|
| G1 | A sandbox subject is the only credential. `login` takes any registered subject (`routers/auth.py`). Anyone who knows `demo-jury` signs in as it, and can `DELETE /me` and break the shared jury account | Account takeover in the demo; personal data if someone typed real data | Env allow-list `SANDBOX_IDENTITIES` in production, `demoIdentities` in `/auth/providers`, `403` on `PATCH`/`DELETE /me` for shared ones. Frontend: picker instead of a free text box | 1 h |
| G2 | No `Content-Language`, `Vary` or `Cache-Control` headers | A shared cache could serve one user's or one language's response to another | One middleware: `Vary: Accept-Language`; `Cache-Control: private, no-store` when a session is present | 0.3 h (with B15) |
| G3 | Collected URLs are not checked for scheme | A `javascript:` link from a crawled page becomes a clickable XSS on the card page | Drop non-`http(s)` URLs at ingest; same check in the seed loader | 0.3 h |
| G4 | Markup is not stripped from model and page text | Low today (React escapes text), real if anyone ever renders HTML | Strip tags at ingest; never use `dangerouslySetInnerHTML` (a lint rule) | 0.3 h |
| G5 | Admin endpoints have no rate limit (the token check is constant time, good) | Brute force of `ADMIN_TOKEN` | Reuse `RateLimiter` on the admin router; refuse to start when `ADMIN_TOKEN` is shorter than 32 characters | 0.2 h |
| G6 | `/stats/usage` accepts any `from`/`to` | Counts under 5 can be worked out by comparing overlapping periods | Minimum 7 days, maximum 366, `from` ≤ `to` | 0.2 h |
| G7 | Input limits: repeated ids in `/compare`, `trlMin` > `trlMax`, unbounded `offset`, unbounded `tag` list, free `region` | Wasted queries; odd answers | Validate in the routers (`422`) | 0.3 h |
| G8 | The rate-limit key trusts `CF-Connecting-IP` (`security.py`). Port 8000 is also reachable on the LAN, where a client can set that header | A LAN client can dodge the rate limits | Trust the header only from the tunnel (`cloudflared` address), or bind the API to localhost and let only `cloudflared` reach it | 0.3 h |
| G9 | Registration email is not verified | `consentToContact` could make PCI write to someone who never signed up | PCI confirms the address before the first contact; later an email check | process |

Not gaps, by design: `/audiences` and `/auth/providers` are public; `/stats/usage` is open to every signed-in user (decided in Q1, counts under 5 hidden); the session token never reaches the browser.

**Grounding:** Redocly lint valid, the same 3 warnings as draft 2. Generated types typecheck. The live contract test passes against draft 4 (3 passed). Request bodies checked with `jsonschema`: the sandbox body the frontend sends today is valid; a ticket body is valid; both fields together, or a ticket with `provider: sandbox_id`, are rejected; `javascript:alert(1)` is rejected as a `WebUrl`. All schema examples validate.

## 0a. Revision: draft 3, version 1.1.0-draft.3 (2026-11-22, mentor feedback)

**Changes requested by the mentor:** a drop-in for the national login (mObywatel, Profil Zaufany), Ukrainian with the language picked by the server, similarity hits kept on the card, and a configurable source registry. Findings: `docs/MENTOR-FEEDBACK-2026-11-22.md`. Login research: `docs/api/AUTH-PROVIDERS.md`.

- **Language negotiation.** New parameters `lang` (query) and `Accept-Language` (header) on all 25 `/api/v1` JSON operations. `LanguageCode` is `pl`, `en`, `uk`. `LocalizedText` is now `oneOf` a string (language named in the request) or the deprecated `LocalizedTextMap` (`pl`, `en`, `uk`). `User.preferredLanguage` and `UpdateMeRequest.preferredLanguage` added.
- **Auth.** New: `POST /auth/{provider}/start`, `GET /auth/{provider}/redirect`, `POST /auth/{provider}/acs` (SAML artifact), `GET /auth/{provider}/callback` (OIDC), `POST /auth/exchange` (`200` session or `202` `RegistrationTicket`). `AuthProvider` gains optional `flow`, `assuranceLevel`, `methods`, and `kind: oidc`. `RegisterRequest` takes `registrationTicket` in place of `providerSubject`. `logout` may return `200 {redirectUrl}` for single logout. New error codes: `auth_cancelled`, `auth_failed`, `state_invalid`, `assurance_too_low`, `provider_unavailable`.
- **Cards.** Optional `Card.relatedWork` (`RelatedWork` items) and `Card.machineTranslated`.
- **Admin.** `GET /admin/source-config` (`SourceConfigStatus`) shows readiness per source and `tokenPresent`, never a token value.

**Compatibility.** Every change is additive or widens a type. A client that sends no language gets the same object form as before (plus `uk`). The sandbox flow is unchanged.

**Checks re-run:**
- Check 6 (auth): the redirect flow keeps identity data off the frontend. The browser carries only a one-time code (60 s, single use) and the `state`. `returnTo` must be an allowed origin (open-redirect guard). **Risk R7:** the national node returns the PESEL. The backend stores only an HMAC with `IDENTITY_PEPPER`.
- Check 4 (shapes): the "exactly one of `providerSubject` or `registrationTicket`" rule is in the description and enforced by the backend (`422`). A `oneOf` with `required` caused Redocly warnings, so it was left out.
- Check 9 (caching): responses that depend on the language must send `Vary: Accept-Language`, or a cache serves the wrong language.
- **Risk R8:** generated frontend types now see `LocalizedText` as `string | LocalizedTextMap`. `pick()` handles both (changed on this branch). F13 removes the object branch.
- Grounding: Redocly lint valid, the same 3 warnings as draft 2. `openapi-typescript` generation and `npm run typecheck` pass after the `pick()` change. The live contract test (`CONTRACT_BASE_URL=https://demo.delta43.net pytest tests/test_contract.py`) passes against draft 3: 3 passed.

## 0. Revision: draft 2 (2026-11-21 evening)

**Change requested by the team:** everyone signs in and picks a role, to deter misuse of the intellectual property on the cards.

- Added `Auth` tag: `GET /auth/providers`, `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /me`, `PATCH /me`, `DELETE /me`. 22 operations in total.
- Default security is now `userBearer` (session token). Public: `/health`, `/api/v1/audiences`, `/api/v1/auth/providers`, `/auth/register`, `/auth/login`. Every protected operation lists `401`.
- Role is one of the six audience ids. New error codes: `account_exists`, `registration_required`, `terms_not_accepted`.
- Registration requires `acceptedTerms: true` (`const: true`). The mock returns 422 when it is false (checked).
- The demo provider is `sandbox_id` and `User.identityVerified` is always false for it. The real login.gov.pl flow is a SAML redirect. Adding it later means new redirect endpoints, which is an additive change.
- Usage events: the server attaches the role, not the user id. Usage stats are aggregated by role.

**Checks re-run for the change:**
- Check 6 (auth): every write now has auth except register and login, which are public on purpose and rate limited. **Risk R5:** a sandbox identity is not proof of identity. The UI must say "test identity" and the pitch must say real verification needs login.gov.pl onboarding.
- Check 4 (shapes): request bodies for auth are closed (`additionalProperties: false`).
- Check 8 (idempotency): `logout` is safe to repeat. `register` with an existing identity returns `409 account_exists`, so retries cannot create duplicates.
- **New personal data:** email, affiliation, interests. **Risk R6:** GDPR (RODO). Needs a privacy notice at registration, a retention period, and erasure (`DELETE /me`, added). Consent to contact is a separate optional flag.
- Grounding: lint valid. Mock checked: 401 without token, 200 with token, public `/audiences` and `/health` 200, register 201, register with `acceptedTerms: false` 422.

The rest of this review describes draft 1 and still holds, except where it says search is public.

## 1. Contract summary

15 operations, base path `/api/v1` (health is `/health`, unversioned). JSON, camelCase, success body `{ data }`, list body adds `meta { total, limit, offset }`, error body `{ error { code, message, details, requestId } }`.

| Area | Operations | Auth |
|---|---|---|
| Cards | `GET /cards`, `GET /cards/{id}`, `GET /cards/{id}/similar`, `GET /cards/{id}/history`, `GET /compare` | Public |
| Reference | `GET /facets`, `GET /audiences`, `GET /sources` | Public |
| Statistics | `GET /stats/overview`, `GET /stats/usage` | Public |
| Events | `POST /events` | Public write, anonymous |
| Admin | `POST /admin/collect-runs`, `GET /admin/collect-runs`, `GET /admin/collect-runs/{id}` | Bearer token |
| System | `GET /health` | Public |

There is no endpoint that submits an idea, creates an account or moves money. This follows the organisers' FAQ section 6.

## 2. Findings per check

| # | Check | Result |
|---|---|---|
| 2 | Naming and paths | Pass. Plural resources (`cards`, `sources`, `collect-runs`). Hierarchy reflects ownership (`/cards/{id}/similar`). `/compare`, `/facets`, `/audiences` are read-only helper views, named as nouns. `/health` is unversioned on purpose |
| 3 | HTTP methods | Pass. Every read is GET with no side effects. Both POSTs create something (an event, a run). Compare uses GET with up to four ids in the query, which fits the URL length limit |
| 4 | Shapes | **Fixed during review:** `Audience.defaultFilters` was a free object. It is now the typed `CardFilters`. Remaining: `UsageEvent` is closed (`additionalProperties: false`). `Evidence.value` allows number, string or boolean on purpose. Nullable fields are typed with `null`. Casing is camelCase everywhere. Envelope is consistent |
| 5 | Errors | **Fixed during review:** malformed JSON now returns `400 bad_request`, separate from `422 validation_failed`. Codes are an enum. Messages carry no internal detail. 401, 403, 404, 409, 422, 429, 500 and 503 are used for their normal meaning |
| 6 | Auth | Admin endpoints need a bearer token. Public reads are marked `security: []` so they are visibly intentional. There is no tenant, so no tenant filter. **Open:** `POST /events` is a public write. See risk R1. `GET /stats/usage` is public. See question Q1 |
| 7 | Pagination | Pass. `limit` (default 20, max 100) and `offset`, with `total`. `similar` has a small cap (max 20, no offset). Facet lists are capped at 50 options. `history` is unbounded but small by nature |
| 8 | Idempotency | Pass. `POST /events` is deduplicated by a client `eventId`. `POST /admin/collect-runs` needs an `Idempotency-Key` (same key and body returns the same run, same key and different body returns 409). **Fixed during review:** a second run while one is active now returns `409 run_in_progress` |
| 9 | Versioning | URL versioning (`/api/v1`). Rule in the description: inside v1 only optional fields and new endpoints are added. Breaking changes go to v2 |
| 10 | Alignment with existing API | Not applicable. The service is new. The submission repository held only a README when checked |

## 3. Overall assessment

**Ready to implement**, with the three fixes above already applied. The remaining items are decisions, not defects.

## 4. Risks and open questions

| ID | Item | Proposal |
|---|---|---|
| R1 | `POST /events` has no auth, so anyone can post fake events and skew the PCI statistics | Rate limit per IP in the backend. Cap body size. Closed field set. Accept that the numbers are indicative. Do not store IP addresses |
| R2 | The static admin token in `ADMIN_TOKEN` is weak | Fine for a hackathon demo. Use a long random value. Serve the admin screen only from a field where the token is typed. Rotate after the demo |
| R3 | Tunnel and CORS: the browser calls the API on another origin | Set `CORS_ORIGINS` to the exact web origin. Do not use `*` with credentials |
| R4 | Server-side rendering needs a different API address from the browser | `API_BASE_URL_INTERNAL` (compose network) and `NEXT_PUBLIC_API_BASE_URL` (browser). Already in `compose.yaml` and `.env.example` |
| Q1 | Should `/stats/usage` be public or admin only? | Public is simpler for the demo. The FAQ says analytics are anonymous. Counts under 5 are hidden. Decide with the PCI mentor |
| Q2 | Card id: UUID or a readable slug in URLs? | UUID now. Adding an optional `slug` field later is a backward-compatible change |
| Q3 | Search language: one `q` matches both languages. Good enough? | Yes for the demo. Revisit if Polish matching is poor |
| Q4 | `couldAlsoBeUsedIn` and `explanation` are model-written. They are always estimates | Backend must run the "no number outside the evidence" check on both before storing |

## 5. Reference grounding

| Contract named | Status |
|---|---|
| OpenAPI 3.1.0 document | Grounded. Redocly CLI lint output seen (valid) |
| Prism 5 as the mock server, with `--multiprocess=false` | Grounded. Ran it. The default multiprocess mode crashed on startup |
| `Prefer: code=<status>` header on Prism | Grounded. 404 and 429 observed |
| `openapi-typescript` for generated types | Grounded. Version 7.13.0 ran on the file |
| Compose `ports: !override` for the production file | Grounded. `config` output shows `host_ip: 127.0.0.1` |
| Image `pgvector/pgvector:pg16` | `[ungrounded: image and tag not pulled in this review]` |
| Image `stoplight/prism:5` | Grounded. Pulled and run |
| Healthcheck `wget` inside the backend image | `[ungrounded: depends on the image the backend owner builds; busybox images have wget, slim images may not]` |

## 6. Next step

The backend owner implements against `openapi.yaml`. The frontend team builds against the mock (`docs/FRONTEND-START.md`). Any change goes through the contract first. A contract test (schemathesis or similar) against the real backend is listed in `TASKS.md`.
