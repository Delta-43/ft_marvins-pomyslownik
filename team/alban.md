# Alban

Edit only this file. Task details (dependencies, estimates, done-when) are in `TASKS.md`. The list of all task IDs is in `team/README.md`.

Status: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked (say why in Blockers).

## My tasks

- [x] **Landing page** (agreed flow, first screen; no task ID). `/` in the Next.js app, on `main` since PR #6. Ported from the brand prototype and aligned with `DESIGN.md`: hero with the 3D render (plays the hero loop, pause button, still image with reduced motion), sign-in panel linking to `/logowanie` and registration, how it works, four doors, constellation, who it is for, principles, call to action, own footer, no navbar. Public: no card data. Route groups: the landing is `(landing)`, the app pages keep their chrome in `(app)`, URLs unchanged.
- [x] **New logo** (brand). Logotype "Pomysłownik" in Lato Black, outlined, with the light bulb and otter symbol as the "!" of "Pomysłownik!". In `frontend/src/components/Logo.tsx` (same `Logo` / `Sygnet` API, so every page uses it) and as the favicon `frontend/src/app/icon.svg`.
- [x] **Landing artwork** (Blender). 3D renders in `frontend/public/landing/` (AVIF + WebP with alpha): hero symbol, category icons for universities, patents, labs and startups, constellation, call to action. Switched to the new symbol. Hero loop video (VP9 + H.264) with poster.
- [x] **P7** (part): fixed the frontend image build in CI. The image now generates the API types from the contract (`docs/api` passed as the named build context `contract`). Changed `frontend/Dockerfile`, the CI images step and `compose.yaml`. CI itself: Delta.
- [x] Merged `main` and branch `Philip` into `alban` and got it into `main` through PR #6 (all five required checks green).
- [x] `TASKS.md` status update at 00:05, checked against the team files, branches, CI and the live servers (PR #7).
- [x] **Brand charter** (no task ID). `docs/design/` (identity board, components board, tokens, logo set) and `DESIGN.md` on `main`. Lato for headings, Atkinson Hyperlegible for text, no em dashes.
- [x] `TASKS.md` status check after PR #29 (branch `tasks/status-1122`).
- [x] **D1** PCI and Podkarpackie palette (PR #34). `DESIGN.md` §2 and `docs/design/tokens.css` v2: Granat = PCI Navy `#001A49`, Głębia `#035487` for links and focus, Mgła surfaces, white Papier, Stal borders, Tak `#027641`, blue-to-green band as decoration only. Every text and UI pair measured (WCAG formula). Colour-blindness simulation: Patenty moved to `#E3EDA0`, because it merged with Startupy under deuteranopia (ΔE 7.7, now 13.8). Tokens are not yet applied in `frontend/src` (that is F17).

## Doing now

D1 done (PR #34). Free for the next task.

## Blockers

- ~~For Delta: production web `https://pomyslownik.delta43.net` still serves the old scaffold page.~~ Fixed: it serves the real landing page now.
- For whoever owns `DESIGN.md`: section 1 (Logo) still describes the old "P" sygnet. It should describe the new logotype and symbol.
- For Philip (PR #32): D1 is done in PR #34 with PCI Navy `#001A49` and Deep blue `#035487`. PR #32 also changes `DESIGN.md` and `tokens.css` (Granat to `#0085CC`, which fails 4.5:1 for text), so the two PRs touch the same lines. Please drop the palette part of `ed6a4e6`, or rebase on #34 once it is merged.

## Log

| Time | Update |
|---|---|
| 21:57 | Landing 3D renders (AVIF + WebP, alpha) pushed to branch `alban` |
| 22:18 | Hero loop video (VP9 + H.264) and poster |
| 22:45 | Renders switched to the new logo (light bulb with otter); old-logo video removed |
| 22:55 | Brand charter v1.0 (`docs/design/`) and `DESIGN.md` on `main`: Lato display font, no em dashes rule |
| 23:18 | Hero loop video with the new logo |
| 23:27 | Landing page `/` built in the Next.js app; new logo in `Logo.tsx` and the favicon |
| 23:40 | Landing matches the brand prototype and `DESIGN.md`; route groups `(landing)` and `(app)` |
| 23:42 | Navbar removed from the landing page |
| 23:53 | CI fix: the frontend image generates the API types from the contract |
| 23:55 | PR #6 merged into `main` (all five checks green) |
| 00:05 | `TASKS.md` status update (PR #7) |
| after 04:07 | `TASKS.md` status check after PR #29: open branches, palette conflict, open "Now" tasks (branch `tasks/status-1122`) |
| 04:45 | Took D1 (PCI palette), draft PR #34 |
| later | D1 done: palette v2 in `DESIGN.md` and `tokens.css`, contrast and colour-blindness checked |
