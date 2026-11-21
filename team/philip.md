# Philip

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [~] **F11** Sign-in and registration. Done: sign-in gate (`src/proxy.ts`: `/szukaj`, `/wyniki`, `/karta`, `/profil` need a session, redirect to `/logowanie?next=`), login page, temporary "Wejdź w tryb demo" button, sign-out. In the working tree, not yet committed: login and registration against `/api/v1/auth/*`, httpOnly session cookie, `/sesja-wygasla` on 401, profile page with role change and account deletion. Left: commit, test against the real API (B12), keyboard check, role sets the default preset.
- [~] **F1** Home (now `/szukaj`, signed-in only). Done: search box, six audience presets. In the working tree: presets from `/api/v1/audiences`. Left: overview numbers from `/stats/overview`, "how it works" strip.
- [~] **F2** Results (`/wyniki`). Done: layout, filter column, cards with category and fact/estimate labels (mock data). In the working tree: real `GET /api/v1/cards` with filters. Left: filters from `/facets`, sort, pagination, filter chips, compare selection, empty/loading/error states.
- [~] **F3** Card page (`/karta/[id]`). Started in the working tree, not committed.

Work outside the task list:

- [x] Visual identity in the app: brand tokens, fonts (Lato, Atkinson Hyperlegible Next, serif for technical values), logo component.
- [x] New page flow: landing `/` (graphics by Alban) → `/logowanie` → `/szukaj` → `/wyniki`.
- [x] Liquid glass reskin of all screens (glass surfaces, colour background, glass header and footer). Falls back to solid surfaces when the user turns on reduced transparency.
- [~] Figma file with brand variables, text styles, components and the screens: https://www.figma.com/design/3kptD58SMsC8cI1tiChPUi (team 42 HackNation 2026). Out of date: the new flow and the glass look are not in it yet (Figma Starter plan call limit).

## Doing now

Since 22:05: sign-in and real-API wiring (F11, F2) in the working tree, not yet committed.

## Blockers

- Figma sync blocked by the Starter plan call limit. Needs a paid seat or the limit reset. Not blocking anyone else.

## Log

| Time | Update |
|---|---|
| 21:01 | Visual identity, fonts, logo, login and results pages (branch `Philip`) |
| 21:05 | Figma file created with tokens, components and three screens |
| 21:29 | New flow: landing, sign-in gate, demo mode |
| 21:35–21:51 | Liquid glass reskin, glass header and footer, serif for technical values |
| 22:01 | Landing page tidy-up. Branch `Philip` pushed. Not yet in `main` |
