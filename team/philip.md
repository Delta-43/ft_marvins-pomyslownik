# Philip

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [x] **F0** Scaffold (with Delta, who built the base). Philip finished it: i18n with next-intl, Polish first, PL/EN switch with round flags bottom right in the footer on every page (cookie `NEXT_LOCALE`, works without JavaScript), every UI string in `messages/pl.json` and `messages/en.json` (keys type-checked against the Polish file), API texts and dates follow the language. Error and loading components: `loading.tsx` (glass skeleton + live-region message), `error.tsx` (message, error ID, retry), `not-found.tsx` (real 404), `global-error.tsx` (last resort, both languages). Verified against the mock (`docker compose --profile mock up`): landing, login, demo sign-in, search, results, card and profile all load mock data, no page errors.
- [~] **F11** Sign-in and registration. Done, on the live API: login and registration with the sandbox provider (labelled "test identity"), unknown identity goes to registration, httpOnly session cookie set by the Next.js server, sign-in gate in `src/proxy.ts` (`/szukaj`, `/wyniki`, `/karta`, `/profil`), any 401 clears the session via `/sesja-wygasla` and returns to `/logowanie?next=`, sign-out calls `/auth/logout`, profile page with role change and account deletion (`DELETE /me`). Demo mode signs in to the live API as the shared `demo-jury` identity, with a "Tryb demo" badge. Left: keyboard check, role sets the default preset on `/szukaj` (the page is ready for it).
- [x] **F1** Home (`/szukaj`, signed-in only). Done: Philip. Search box; six audience presets from `/api/v1/audiences`, main audience (universities, labs, scientific institutions) first and highlighted; each preset links to `/wyniki` with its default filters written out, so they show as ticked there; overview numbers from `/stats/overview` (innovations, sources, share of confirmed fields, last refresh) with a short note if the call fails; three-step "how it works" strip. All text in PL and EN. Tested on the live API (27 cards, 40 sources, 11% confirmed).
- [x] **F2** Results (`/wyniki`). List, filters from `/facets` with counts that follow the search (area, implementation level, TRL range, Polish IP status, region, topics), multi-select sent comma-separated, sort (5 options, kept with the filters), paging, active filter chips (each removes one filter) and clear all, compare selection (2 to 4 cards, kept across pages, opens `/porownaj?ids=id1,id2`), loading skeleton, empty, error and rate-limit states. Clean URLs via a proxy redirect. Checked in Chrome: 28 checks pass (keyboard only, visible focus on 79 controls, axe 0 serious, results fit 375px).
- [~] **F3** Card page (`/karta/[id]`). Done: implementation level, TRL, three scores, Oslo check, "could also be used in", each value with its source link or method, numbered sources with quoted passages (`lang` set), owner link, dates. Left: similar cards and history (endpoints not live yet), evidence drawer.
- [x] **F4** Compare (`/porownaj`). Done: Philip. Two to four cards side by side from `/api/v1/compare`: table with caption, column headers (card title, organisation, remove) and row headers (10 criteria); best value marked in words ("★ Najlepsza wartość", from the API's `isBest`); confirmed/estimate label on every value; "Za mało danych" / "Nie dotyczy" instead of empty numbers; dates per language. Phone width: the table scrolls sideways inside a keyboard-focusable region, criteria column fixed, page itself does not scroll. Selection kept for the tab (`sessionStorage`, same key as F2's results ticks): "Dodaj do porównania" on card pages, header tray "Porównanie (n)", the comparison page keeps the tray in sync. Limit of 4 with a written note. States: fewer than 2, more than 4, unknown card, API error. PL and EN. Tested in Chrome (20 checks: desktop, 375 px phone, keyboard, English)

Work outside the task list:

- [x] Visual identity in the app: brand tokens, fonts (Lato headings, Atkinson Hyperlegible Next body, Roboto Serif for technical values), logo component.
- [x] New page flow: landing `/` (graphics by Alban) → `/logowanie` → `/szukaj` → `/wyniki` → `/karta/[id]`.
- [x] Liquid glass reskin of all screens. White glass header and footer. Falls back to solid surfaces when the user turns on reduced transparency.
- [x] Frontend switched from the mock to the live API (`https://demo.delta43.net`). All calls run on the Next.js server, the token never reaches the browser bundle. Contract and types from `backend/b3-b12-scaffold`.
- [~] Figma file with brand variables, text styles, components and the screens: https://www.figma.com/design/3kptD58SMsC8cI1tiChPUi (team 42 HackNation 2026). Out of date: the new flow and the glass look are not in it yet (Figma Starter plan call limit).

## Doing now

Since 00:16: F2 (results): sort, active filter chips. Branch `Philip` is up to date with `main`.

## Blockers

- Figma sync blocked by the Starter plan call limit. Needs a paid seat or the limit reset. Not blocking anyone else.
- For Delta: register and login are limited to 15 per minute per address. On the deployed site every sign-in comes from the web server's one address, so the jury could hit the limit. Needs a higher limit or an exemption for the web server.

## Log

| Time | Update |
|---|---|
| 21:01 | Visual identity, fonts, logo, login and results pages (branch `Philip`) |
| 21:05 | Figma file created with tokens, components and three screens |
| 21:29 | New flow: landing, sign-in gate, demo mode |
| 21:35–21:51 | Liquid glass reskin, glass header and footer, serif for technical values |
| 22:01 | Landing page tidy-up. Branch `Philip` pushed. Not yet in `main` |
| 22:06 | Live API: sign-in, registration, results, card page, profile, demo mode on the live API (`demo-jury`). Tested end to end with temporary accounts, all deleted. The backend returned 502 for a few minutes before 21:59 (to report to Delta) |
| 23:36 | PL/EN language switch (footer, bottom right) and the whole site in Polish and English from `messages/*.json`. Tested on a production build: switch, persistence across pages and sign-in, every page in both languages, no JS errors |
| 23:47 | **F0 done.** Loading, error, 404 and global-error screens in PL and EN. Whole site run against the mock API, every page OK |
| 23:54 | **F1 done.** Overview numbers, main-audience preset, presets carry their filters, "how it works" strip, PL and EN |
| 23:55 | F2: multi-select filters fixed. Lists are now sent to the API comma-separated, as the contract says (a repeated `area=` only kept the last value, so two areas showed one area's cards). Facet counts now follow the search and filters. Unknown filter values in the URL are dropped instead of causing a 422. Tested on the live API: Technological + Educational = 20 (was 8) |
| 00:05 | Merged `main` into `Philip`: the team's design restored (route groups `(app)` and `(landing)`, new landing page with hero video, logo v2, favicon). Kept all of Philip's frontend work (i18n, F0, F1, F2 fix, live API pages); moved pages unchanged in content |
| 00:12 | Landing page in Polish and English, PL/EN switch at the top right of the hero and in the footer (dark variant) |
| 00:16 | Merged the latest `main` again (TASKS status, Alban's file, unused landing images removed). Every page checked in PL and EN, typecheck clean. `Philip` level with `main` |
| 00:38 | **F2 done.** Sort, filter chips, TRL, Polish IP, region and topic filters, compare selection, loading skeleton, clean URLs. Browser-tested on the live API. Found, not fixed (outside F2): the header nav overflows by 324px at phone width on every signed-in page; without JavaScript, streamed pages stay hidden because of the root `loading.tsx` |
| 00:48 | **F4 done** on branch `philip-f4`: `/porownaj`, add-to-comparison on card pages, header tray, phone layout. The phone-width header overflow is solved by F2's Menu button (01:04) |
| 01:04 | Phones and no-JS: header has a Menu button below 1024px (native `<details>`, works without JavaScript, closes on navigation, Escape and tap outside). Every page now loads as one complete document, so sign-in and all signed-in pages work without JavaScript (`loading.tsx` streamed the content into hidden blocks). The loading skeleton now shows during in-app navigation (`NavigationProgress`), including paging and filter chips. Results on phones: filters behind a "Filtry (n)" button, results column fixed (was wider than the screen with cards selected), search bar and overview numbers fit at 320px. Checked in Chrome: 43 layout/no-JS checks and the 30 F2 checks pass, 7 pages × 7 widths (320 to 1440px) |
