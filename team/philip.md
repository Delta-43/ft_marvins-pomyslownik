# Philip

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [~] **F0** Scaffold (with Delta). Done: i18n with next-intl, Polish first, PL/EN switch with round flags bottom right in the footer on every page (cookie `NEXT_LOCALE`, works without JavaScript), every UI string in `messages/pl.json` and `messages/en.json` (159 keys each, keys type-checked against the Polish file), API texts (`{pl, en}`) and dates follow the chosen language, `<html lang>` follows it. Left: `error.tsx`, `loading.tsx`, `not-found.tsx`, one run against the mock (`docker compose --profile mock up`).
- [~] **F11** Sign-in and registration. Done, on the live API: login and registration with the sandbox provider (labelled "test identity"), unknown identity goes to registration, httpOnly session cookie set by the Next.js server, sign-in gate in `src/proxy.ts` (`/szukaj`, `/wyniki`, `/karta`, `/profil`), any 401 clears the session via `/sesja-wygasla` and returns to `/logowanie?next=`, sign-out calls `/auth/logout`, profile page with role change and account deletion (`DELETE /me`). Demo mode signs in to the live API as the shared `demo-jury` identity, with a "Tryb demo" badge. Left: keyboard check, role sets the default preset on `/szukaj`.
- [~] **F1** Home (`/szukaj`, signed-in only). Done: search box, six audience presets from `/api/v1/audiences` linking to `/wyniki?audience=`. Left: overview numbers from `/stats/overview`, "how it works" strip.
- [~] **F2** Results (`/wyniki`). Done: real `GET /api/v1/cards`, area and implementation-level filters from `/facets` with counts, paging, empty and error states (error shows the `requestId`), confirmed/estimate labels in text, "Za mało danych" for null scores, "Nie dotyczy" for TRL outside technology, Polish plurals. Left: sort, active filter chips, compare selection (`/compare` not live yet).
- [~] **F3** Card page (`/karta/[id]`). Done: implementation level, TRL, three scores, Oslo check, "could also be used in", each value with its source link or method, numbered sources with quoted passages (`lang` set), owner link, dates. Left: similar cards and history (endpoints not live yet), evidence drawer.

Work outside the task list:

- [x] Visual identity in the app: brand tokens, fonts (Lato headings, Atkinson Hyperlegible Next body, Roboto Serif for technical values), logo component.
- [x] New page flow: landing `/` (graphics by Alban) → `/logowanie` → `/szukaj` → `/wyniki` → `/karta/[id]`.
- [x] Liquid glass reskin of all screens. White glass header and footer. Falls back to solid surfaces when the user turns on reduced transparency.
- [x] Frontend switched from the mock to the live API (`https://demo.delta43.net`). All calls run on the Next.js server, the token never reaches the browser bundle. Contract and types from `backend/b3-b12-scaffold`.
- [~] Figma file with brand variables, text styles, components and the screens: https://www.figma.com/design/3kptD58SMsC8cI1tiChPUi (team 42 HackNation 2026). Out of date: the new flow and the glass look are not in it yet (Figma Starter plan call limit).

## Doing now

Since 22:06: keyboard and accessibility check of the sign-in and results flow.

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
