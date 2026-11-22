# Mentor feedback, 2026-11-22: findings and decisions

Written 2026-11-22 02:30 CET on branch `docs/mentor-feedback-2026-11-22`. Ten points from the mentor review.
For each point: what was asked, what we found in the code or in sources, the decision, and the task IDs in `TASKS.md` (section "Mentor feedback").
Requirement IDs M1 to M10 are in `REQUIREMENTS.md`.

| # | Point | Verdict today | Contract change | Tasks |
|---|---|---|---|---|
| 1 | Login drop-in for mObywatel and Profil Zaufany | Not built. Research done, contract designed | Yes (Auth) | B13, B14, F12, R11 |
| 2 | Ukrainian, language picked by the server | Not built. Contract designed | Yes (all text) | B15, F13, R12 |
| 3 | Zoom, colour-blind safe, high and low contrast, WCAG 2.2 navigation | Partly. Gaps listed in §3 | No | F14, F15, F9 |
| 4 | WAI-ARIA | Partly. Gaps listed in §4 | No | F16 |
| 5 | PCI and Podkarpackie colours | Proposal with measured contrast in §5 | No | D1, F17 |
| 6 | Visual hierarchy, layout, proportional type | Proposal in §6 | No | D2, F18 |
| 7 | Easy to use | Measures in §7 | No | Q4, F19 |
| 8 | Keep similarity hits and research on one card | Partly (similar cards only, not stored) | Yes (`relatedWork`) | B17, F20 |
| 9 | Harvest by API, crawl and other ways; config file and `.env` | Yes for the three methods. Config is limited | Yes (admin) | B16, P10 |
| 10 | Frontend for visuals only, backend does the work | Mostly yes. Three leftovers in §10 | Yes (language) | B18, F13 |

> Point 5 references two logos the mentor shared: PCI (Podkarpackie Centrum Innowacji) and the regional brand "Podkarpackie, przestrzeń otwarta". The hex values in §5 come from the PCI logo SVG and the live CSS of pcinn.org and podkarpackie.pl. The regional logo colours are estimates from the screenshot.

## 1. Sign-in: mObywatel and Profil Zaufany

Full research, comparison and flow: `docs/api/AUTH-PROVIDERS.md`.

- mObywatel, Profil Zaufany (SMS code to the user's phone), e-dowód and bank login all arrive through **one** broker: the Węzeł Krajowy (`login.gov.pl`). We integrate once.
- Private entities can join: `SPType=private`, host `podmiotyzewnetrzne.login.gov.pl`. Onboarding needs a signed letter (test access), then an application signed with a qualified signature (production).
- Protocol: SAML 2.0, eIDAS profile, HTTP-Artifact binding and `ArtifactResolve` over SOAP, elliptic-curve keys, separate signing and decryption keys.
- The node returns the PESEL as `PersonIdentifier`. **We never store it.** The backend keeps an HMAC of it only.
- Phone numbers stay with Profil Zaufany and mObywatel. We do not collect them, and we do not build our own SMS codes.
- Contract draft 3 adds `/auth/{provider}/start`, `/redirect`, `/acs`, `/callback`, `/auth/exchange`, registration tickets and `assuranceLevel`. The sandbox flow does not change.

**Decision.** Build the provider interface and the redirect flow with the sandbox as a fake redirect provider (B13). The real login.gov.pl adapter (B14) starts after the hackathon, when PCI can sign the applications. The pitch says this clearly.

## 2. Ukrainian, chosen by the server

Today every text goes out as `{pl, en}`, and the frontend picks one (`pick()` in `frontend/src/lib/api.ts`). The mentor wants the same call to answer in the requested language.

Contract draft 3:
1. The request names the language with `?lang=uk` or `Accept-Language: uk`. `lang` wins. Then the user's `preferredLanguage`, then `pl`.
2. Every `LocalizedText` is then **one string**. Error messages follow. The response sets `Content-Language` and `Vary: Accept-Language`.
3. A request that names no language still gets the object form, now with `uk` too. It is deprecated and goes in v2. This keeps the live frontend working during the switch.
4. Every stored text exists in `pl`, `en` and `uk`. Ukrainian texts made by machine translation are listed in the card's `machineTranslated` field, and the UI shows a note.
5. Source quotes stay in their own language with `passageLang`, as before.

Verified on 2026-11-22: the live API passes the contract test against draft 3 (3 passed), and the frontend typechecks with the new types after a two-line change to `pick()`.

**Font problem found.** Lato and Atkinson Hyperlegible Next, as Google Fonts serves them, have only Latin subsets. Ukrainian text would fall back to a random system font. Roboto and Roboto Serif have Cyrillic. PCI uses Roboto and Lato. Fix: add Roboto with the Cyrillic subset to every font stack, so the browser takes Cyrillic letters from Roboto (task F13, see §6).

## 3. Accessibility: zoom, colour blindness, contrast modes, navigation (WCAG 2.2 AA)

What exists (checked in the code): skip link, `lang` on `<html>`, `prefers-reduced-motion` support, visible focus ring (3 px Granat), status always icon plus word, compare table with `th scope`, `aria-current` in pagination, `role="search"`.

Gaps found:

| WCAG 2.2 criterion | Finding | Fix |
|---|---|---|
| 1.4.4 Resize text, 1.4.10 Reflow | Not tested at 200% and at 320 CSS px (400% zoom) | Test every demo screen. Add a text-size control (100, 125, 150%) that scales the root `rem` |
| 1.4.3 / 1.4.6 Contrast, user modes | No high or low contrast mode. No `prefers-contrast` or `forced-colors` rules. Glass panels with blur reduce contrast behind text | Add `data-contrast="more"` (solid surfaces, black on white, 2 px borders, underlined links) and `data-contrast="less"` (soft background, still at least 4.5:1). Follow `prefers-contrast` by default. Add `forced-colors: active` rules |
| 1.4.1 Use of colour | Category colours are pastels. Patenty `#D6E6A3` and Startupy `#F7C6A8` may look alike with deuteranopia | Keep the icon plus name rule. Simulate protanopia, deuteranopia and tritanopia on the results and card pages, and add a pattern if two categories merge |
| 1.4.11 Non-text contrast | The search box focus ring is Granat at 25% opacity (`SearchBar.tsx`), probably below 3:1 | Use the solid focus ring |
| 2.4.11 Focus not obscured (new in 2.2) | The app header is `sticky top-0` (`(app)/layout.tsx`). There is `scroll-padding-top` only on the landing page | Add `scroll-padding-top` equal to the header height on app pages |
| 2.5.8 Target size (new in 2.2) | Filter chip remove buttons and pagination links not measured | Minimum 24 by 24 px, 44 by 44 px for main actions |
| 3.2.6 Consistent help (new in 2.2) | No help link | Put "Help and contact" in the same place in the footer on every page |
| 3.3.7 Redundant entry (new in 2.2) | Registration may ask for data the provider already gave | Prefill the name from the registration ticket |
| 3.3.8 Accessible authentication (new in 2.2) | Sandbox picker is fine. Real providers handle the login | Allow paste in every field. No puzzles |
| 2.4.1, 2.4.3, 2.1.1 Navigation | Keyboard run of the demo path not done (F9 open) | F9, plus the screen-reader run |

User settings (text size, contrast mode, reduced motion) are kept in a cookie, so the server renders the right theme with no flash. This is display state, so it stays in the frontend.

## 4. WAI-ARIA

Counted in `frontend/src`: 50 `aria-hidden`, 20 `aria-labelledby`, 15 `aria-label`, 7 `aria-disabled`, 6 `aria-describedby`, 3 `aria-current`, 2 `aria-live`, 2 `aria-busy`, 2 `aria-pressed`. **No `aria-expanded` anywhere.**

Rules: native HTML first, ARIA only where HTML has no element. Patterns from the WAI-ARIA Authoring Practices.

| Component | Pattern and attributes |
|---|---|
| Card that expands in place (agreed flow) | Disclosure: a `<button aria-expanded aria-controls>`. The details region has a heading |
| Mobile menu | Native `<details>` (fine). Check the `summary` has a text name, not only icons |
| Filters | `<fieldset>` and `<legend>` per group. Result count in a `role="status"` region. Chip buttons named "Remove filter: …" |
| Search | `<label>` for the input (visible or `sr-only`). If suggestions come later: combobox pattern |
| Language switch | Each option has `lang` (`lang="uk"` on "Українська"). The current one has `aria-current="true"` |
| Contrast and text-size controls | Radio group or buttons with `aria-pressed` |
| Score bars | Text value next to the bar. The bar is `aria-hidden` |
| Forms | `aria-invalid` and `aria-describedby` to the error. `autocomplete` on email and organisation (1.3.5) |
| Landmarks | One `main`, `header`, `footer`. Each `nav` named: main menu, footer, pagination |
| Page changes | Move focus to the `h1` after client navigation, and announce the new title |

## 5. Colours: PCI and Podkarpackie (proposal)

Measured on 2026-11-22 from the live sites. Contrast computed with the WCAG formula.

| Source | Colour | Hex | Contrast on white | Use it for |
|---|---|---|---|---|
| PCI (pcinn.org theme, primary) | Navy | `#001A49` | 16.88:1 | Headings, header and footer surfaces, primary buttons |
| PCI (secondary) | Deep blue | `#035487` | 8.01:1 | Links, secondary buttons, focus ring |
| PCI (accent) | Bright blue | `#0177FD` | 4.15:1 | Large text (24 px and up), borders, icons. **Not small text** |
| PCI (light surfaces) | Mist | `#E7EFF5`, `#DEE7EF` | n/a | Section backgrounds, cards on white |
| PCI (muted) | Steel | `#98AEC5` | 2.28:1 | Dividers and decoration only |
| PCI logo | Blue, green | `#0085CC`, `#6BB437` | 4.02:1, 2.56:1 | Green only on Navy (6.6:1) or as decoration |
| Podkarpackie (podkarpackie.pl) | Navy | `#232F45` | 13.43:1 | Alternative dark surface |
| Podkarpackie | Green | `#027641` | 5.72:1 | Success status ("Tak"), text allowed |
| Podkarpackie | Orange | `#EF6D00` | 3.06:1 | Warning icons, large text only |
| Ours, kept | Iskra yellow | `#FFD93D` | 12.25:1 on Navy | Highlights on Navy only |

The regional logo "Podkarpackie, przestrzeń otwarta" uses light-blue streaks that flow into a blue-to-green hill, with a grey wordmark. The PCI logo repeats the same idea: blue `#0085CC` and green `#6BB437`. So the shared regional signal is **blue moving into green**. Proposal: use one thin blue-to-green gradient band (`#0085CC` → `#6BB437`) as decoration at the top of the header, like the band on pcinn.org. Never put text on it. Take the exact regional gradient stops from the official logo file, not from the screenshot.

Mapping proposal (task D1): Granat `#1B3F8F` → PCI Navy `#001A49` for surfaces and Deep blue `#035487` for links. Papier `#F7F2EB` → white with Mist sections. Tak `#1F7A45` → Podkarpackie green `#027641`. Keep Iskra as the one warm accent. Keep the logo artwork; only its Granat changes to Navy.

## 6. Visual hierarchy, layout and type

PCI's theme (pcinn.org) uses Lato Bold for headings with this scale: h1 52, h2 48, h3 38, h4 32, h5 26, h6 20 px, leading 1.2 to 1.5, and h1 and h2 at 36 px on phones. Body leading is 1.6.

Our scale today: h1 48, h2 32, h3 24, body 16 px. The jumps are uneven (48 to 32 is large, then 24 and 16 are close).

Proposal (task D2, F18):
1. One modular scale, ratio 1.25, fluid with `clamp()`: body 1.0625rem (17 px), h4 1.25rem, h3 1.5rem, h2 clamp(1.75rem, 1.2rem + 2vw, 2.25rem), h1 clamp(2.25rem, 1.5rem + 3vw, 3.25rem).
2. Font stacks: `"Lato", "Roboto", …` for headings and `"Atkinson Hyperlegible Next", "Roboto", …` for body, with Roboto loaded for Cyrillic. In my opinion we keep Atkinson for Polish and English body text, because it is designed for low-vision readers. PCI's Roboto then covers Ukrainian.
3. One primary action per screen. Page title, then the search, then results. Filters in a left column from 1024 px, in a drawer below.
4. Line length 60 to 75 characters for running text. Card grid gap 20 px. More white space between sections than inside them.
5. Remove glass blur behind body text. Keep it for the landing page art only.

## 7. Easy to use

Measures (Q4, F19):
- From the landing page to the first card in **three actions or fewer**: sign in (one click on a test identity), type a search, open a card.
- The role picked at registration sets the default preset and filters (F11 leftover).
- Every empty state says what to do next. Every error says how to recover.
- Plain words. No "TRL" without its explanation on first use.
- A short usability test with three people who have not seen the app: "Find an educational innovation in Podkarpackie and compare two of them." Write down time and stumbles. Feeds the effectiveness numbers (Q3).

## 8. One card for the similarity hits and the research

Today: `/cards/{id}/similar` computes similar catalogue cards on each call (trigram plus shared tags). OpenAlex results are counted for innovativeness evidence, but the works themselves are not kept for people to see.

Decision: keep every hit on the card in a new `relatedWork` list (contract draft 3). Each item has its kind (card, publication, patent, research project, transfer listing, web page), title, link, organisation, region, a public contact page, similarity, the shared tags that explain the match, and the date found. The card page gets a section "Who else works on this" grouped by organisation.

FAQ section 6 excludes social features and investor matching. So the card shows public organisations and their public contact pages. It does not message people or match users with each other. A user who ticks `consentToContact` lets PCI staff make an introduction outside the app. **Ask the mentor** whether this stays inside FAQ section 6 (R7 follow-up).

## 9. Harvesting data, and one config file for sources

Checked in `backend/app/collectors/`:

| Method | Built and live | File |
|---|---|---|
| API | RAD-on project search (no key). OpenAlex works (key `OPENALEX_API_KEY`) | `radon.py`, `openalex.py` |
| Crawl | PTT through its sitemap, robots.txt and Crawl-delay respected, snapshots cached, AI extraction with the quoted passage. Generic page crawler | `crawler.py`, `fetch.py` |
| Document | PDF text and AI extraction, new card or enrichment | `documents.py` |
| Offline | Every collector can read only the snapshot cache, for the demo | `fetch.py` |

Gaps: the config (`data/sources/targets.json`) holds limits and a few URLs only. Tokens are wired into each collector by name. There is no generic API adapter, no RSS or Atom feed reader, and no generic sitemap crawler.

Decision: a source registry, `data/sources/registry.json` (example committed: `registry.example.json`). One entry per source: method, base URL, `tokenEnv` (the name of the `.env` variable, never the value), auth placement, limits, licence, filters, and a JSONPath mapping for a generic API. `.env.example` lists the token variables. `GET /api/v1/admin/source-config` shows which sources are ready and whether each token is set, without showing it (task B16).

## 10. Frontend for visuals, backend for processing

Checked in `frontend/src`:
- Every API call runs on the Next.js server (`lib/api.ts`). The session token stays in an httpOnly cookie.
- Search, filters, sort, scores, similarity, the compare "best value" and the Oslo check all come from the backend. The frontend formats them only (for example 0.82 → "82%").
- The compare selection lives in `sessionStorage`. This is view state, which is correct.

Three leftovers:
1. The frontend picks the language from `{pl, en}` (`pick()`). Draft 3 moves this to the server (F13).
2. On `/wyniki`, a selected filter value that is missing from `/facets` gets the raw slug as its label in both languages (`wyniki/page.tsx`, line 83). This breaks the language rule. The backend should return labels for selected values too (B18).
3. The card page joins evidence rows to fields by id. This is light, but the backend can send the rows inline (B18, optional).

Static interface words (buttons, headings) stay in `frontend/messages/*.json`. That is the frontend's job. `uk.json` is added in F13.
