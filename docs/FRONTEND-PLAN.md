# Frontend rebuild: one plan

Written 2026-11-22 on branch `rebuild/frontend`. This replaces the frontend rows of `TASKS.md` (F0 to F20, D1, D2) for the rebuild. It consolidates the agreed flow, the mentor feedback (`docs/MENTOR-FEEDBACK-2026-11-22.md`) and the contract (`docs/api/openapi.yaml`, 1.1.0-draft.5). The flow prototype by Delta (artifact "Pomysłownik flow", 21.11.2026) is the ground truth for how the site behaves. The design reference is `DESIGN.md`.

## 1. What the contract gives us (review of draft 5)

Checked against the live API on 2026-11-22.

| Area | Contract | Live API today | What the frontend does |
|---|---|---|---|
| Language | `lang` or `Accept-Language` picks one language; every `LocalizedText` is one string; `uk` supported | **Still returns the `{pl, en}` object form, no `uk`** | Send `Accept-Language` on every call. Render through one `text()` helper that accepts both forms and falls back `uk → pl → en`. Show the "machine translation" note when `machineTranslated` lists the language. When B15 lands, nothing changes in the UI |
| Sign-in | Sandbox `login`/`register` with `providerSubject`; `demoIdentities` on the provider; redirect flow for login.gov.pl is design only | Sandbox works. `demoIdentities` not yet sent | Landing card: a free identity field plus a one-click shared demo identity (`demo-jury`). When `demoIdentities` arrives, show it as a picker. login.gov.pl is listed as "coming", disabled |
| Cards list | `q`, `area`, `implementationLevel`, `trlMin/Max`, `tag`, `region`, `audience`, `polishIp`, `polishIpStatus`, `minCredibility`, `includeStale`, `sort`, `limit`, `offset` | Works | Results page reads the URL only. Filters are a plain GET form |
| Facets | Same filters; selected values always returned with labels (B18) | Works | Never invent a label |
| Tags | `/tags?sort=recent&limit=12` | Works | Chips under the search bar (prototype: "latest tags") |
| Card | `summary`, assessment with provenance, `oslo`, `couldAlsoBeUsedIn`, `owner`, `sources` with `passage` and `passageLang`, `evidence` with `label`/`unitLabel`/`queryText`/`origin`, `relatedWork` (optional), `machineTranslated` | `relatedWork` empty on seed cards | Card page shows every section; "Who else works on this" renders when `relatedWork` has items, else the `/similar` hits with the same layout |
| Compare | 2 to 4 ids, rows with `display`, `basis`, `isBest` | Works | Table from rows; "best" marked with text, not colour |
| Stats | `/stats/overview` | Works | Numbers strip on the search page |
| Events | `POST /events`, server-side, fire-and-forget | Works | Server action after search, card view, compare. No free text |
| Profile | `GET/PATCH/DELETE /me` | Works | Profile page: role, language, delete account |

## 2. Decisions

1. **Five screens, one thread.** Landing (with sign-in) → Search → Results → Card. Compare and Profile hang off the header. Everything else is a text page in the footer. Three actions from landing to the first card: sign in, search (or tap a tag), open a card.
2. **The window metaphor from the prototype.** Signing in sweeps the app window open over the landing hero and flies the logo into the header. The search bar glides from the centre of the search screen to the top of the results. A card grows from its tile into its page. Every move has a reverse (the header logo closes the window, "Szukaj" brings the bar back, "← Wyniki" shrinks the card). Built on the browser's view transitions with names keyed on the navigation type; React boundaries only start the transition. Reduced motion: cross-fades only.
3. **Server renders, browser enhances.** Every page is a server component on the real API. Forms are plain GET/POST forms, so the whole flow works without JavaScript. JavaScript adds the moves, the loading bar and the compare basket.
4. **Backend owns meaning, frontend owns words.** Labels, counts, scores, "best" marks and language come from the API. Interface words live in `messages/{pl,en,uk}.json`.
5. **One primary action per screen.** Landing: "Zaloguj się". Search: "Szukaj". Results: open a card. Card: "Dodaj do porównania". Compare: none (reading).
6. **Colour: Delta's palette with the PCI additions, measured.** Papier, Atrament, Kamień, Krawędź and the four category pastels stay. PCI Navy `#001A49` carries dark surfaces and the primary button, Deep blue `#035487` carries links and focus, PCI blue `#0085CC` and green `#6BB437` carry the accent band and large display text only. Every pair in `DESIGN.md` has its contrast number.
7. **Accessibility is a build rule, not a pass at the end.** Native elements first, one `h1` per page, focus moves to the `h1` after navigation, a live region announces result counts, 24 px minimum targets (44 px for primary actions), `scroll-padding-top` under the sticky header, solid focus rings, text size and contrast modes in the footer, `prefers-contrast` and `forced-colors` honoured, every status is icon plus word.
8. **Out of scope for the rebuild:** Insights page (F5), admin page (F6), the redirect sign-in flow (F12, backend B13 not live), Playwright suite (Q1). They stay in `TASKS.md`.

## 3. Screens

| Screen | Route | Mode | What is on it | Primary action |
|---|---|---|---|---|
| Landing | `/` | Persuade | Dark hero left: logo at 2× header size, title, lead, and a sequence of feature panels that fade through (what we collect, how we assess, who it is for). Floating sign-in card right: test identity field, shared demo identity, link to registration, info note, terms and accessibility links. Below the fold: how it works, four doors, principles, footer | Zaloguj się |
| Registration | `/rejestracja` | Operate | Same two halves; the card holds the registration form (identity, e-mail, role with description, organisation, interests, terms, contact consent) | Załóż konto |
| Search | `/szukaj` | Operate | Title, search bar (56 px pill, primary button inside), latest tags as chips, audience presets, numbers strip with their source, how it works in three steps | Szukaj |
| Results | `/wyniki` | Operate | Bar at the top, filters in a left column (drawer on phones), result count live region, sort, active filter chips, collapsed cards, pagination, compare basket | Open a card |
| Card | `/karta/[id]` | Read | Header (area, tags, title, organisation, summary, machine-translation note), assessment grid (level, TRL, three scores, Oslo), "could also be used in", who else works on this, history, sources with quotes, evidence, owner and dates | Dodaj do porównania |
| Compare | `/porownaj` | Read | Table with `th scope`, best value marked "najlepsza" in text, remove a card, phone layout stacks per card | — |
| Profile | `/profil` | Operate | Role, language, consent, delete account | Zapisz |
| Text pages | `/regulamin`, `/dostepnosc`, `/metodologia` | Read | Terms (IP misuse ban), accessibility statement (with the checks run), methodology (the five criteria, fact vs estimate) | — |

## 4. Consolidated task list

Replaces F0 to F20 and D1, D2 for the rebuild. Each row names the requirement ids it covers.

| ID | Task | Covers | Done when |
|---|---|---|---|
| ~~N1~~ | ~~`DESIGN.md` rewritten as a style guide (colours with contrast, type scale, spacing, radius, shadows, components with states, motion, accessibility)~~ **Done: Philip** | D1, D2, M3, M5, M6 | Every token used in code is in the file with its contrast number |
| N2 | Scaffold: tokens in `globals.css`, three languages, API client with `Accept-Language`, generated types from draft 5, session cookie, proxy gate, display settings cookie | F0, F13, F14, M2, M10 | `npm run typecheck` clean. `uk` switch shows a fully Ukrainian interface |
| N3 | Landing with sign-in card and the animated hero | F11, F19, M7 | Sign in with the demo identity in one click. Works without JavaScript |
| N4 | Registration page | F11, 3.3.7, 3.3.8 | Role sets the default preset. Paste allowed, no puzzle |
| N5 | Search screen: bar, latest tags, presets, numbers with source, how it works | F1, F4, F18 | Preset and tag lead to results in one action |
| N6 | Results: filters, sort, chips, cards, pagination, compare basket, live count | F2, F15, F16, B18 | Keyboard-only run completes. Empty, error and rate-limited states say the next step |
| N7 | Card page with every section, "Who else works on this", evidence drawers | F3, F14, F20, M8 | No number without a source link or a "not enough data" note |
| N8 | Compare page | F4 | Table headers, phone layout |
| N9 | Profile, terms, accessibility statement, methodology | F7, F11, 3.2.6 | Help and contact in the same footer place on every page |
| N10 | Motion: opening, closing, search ↔ results, results ↔ card, filter dip | prototype motion spec | Every move verified in slow motion on desktop and phone; reduced motion cross-fades |
| N11 | Usage events from search, card view and compare | F8, F16 | Never blocks the screen |
| N12 | Review passes: `impeccable` critique and audit, `better-ui`, `better-accessibility`, `improve-animations`; fixes applied, accessibility first | F9, M3, M4 | Findings recorded in `docs/FRONTEND-REVIEW.md` with what was fixed |

## 5. Verification

- Headless Chrome drives the demo path at 1440×900 and 390×844: sign in, search, open a card, back, compare, close. Zero console errors.
- axe (via the impeccable audit or `@axe-core/cli`) on every screen: no serious issues.
- Keyboard-only walk of the demo path. Focus visible at every stop.
- 200% text size and 320 px width on the results page: no horizontal scroll.
- Each contrast mode: text pairs at 4.5:1 or more.
