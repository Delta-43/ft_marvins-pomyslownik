# Frontend review record (rebuild)

Task N12 of `docs/FRONTEND-PLAN.md`. Each pass lists what was reviewed, what was found, and what was done.

## Pass 1: static templates, 2026-11-22

Reviewed: landing, search, results and the in-place card detail, with placeholder data, at 1440×900 and 390×844 (`docs/design/templates/`). Each review was run by a separate reviewer from the code and the screenshots, without a live browser or a screen reader.

Skills used (cloned, not installed in the repo):

| Review | Source |
|---|---|
| impeccable critique | `github.com/pbakaus/impeccable` |
| better-ui | `github.com/jakubkrehel/skills` |
| better-accessibility | `github.com/jakubkrehel/skills` |
| improve-animations | `github.com/emilkowalski/skills` |

### Results

| Review | Verdict before fixes | Findings |
|---|---|---|
| better-accessibility | Block: 5 serious | 27 |
| impeccable critique | 27/40 (Nielsen heuristics) | 20 |
| better-ui | Approve, no blocking finding | 20 |
| improve-animations | 4 high in the existing motion | 8, plus a plan for the page moves |

### Fixed (accessibility first)

Accessibility
- Filters no longer reload the page on each change: the form moves to the new URL in place, the changed control keeps focus, selects wait 400 ms, and a note says the results refresh on change (3.2.2).
- Opening a card moves focus to its title; Esc or "Wróć do wyników" returns focus to that card; after a removed chip or a page change focus goes to the results heading (2.4.3).
- The phone filter sheet behaves as a dialog: named, the page behind is inert, focus moves in and back to "Filtry", Esc closes it, and it stays open while filters change (2.4.3, 2.4.11, 4.1.2).
- Every results state has its own page title: the search, the page number, the open card (2.4.2).
- Buttons wrap, so nothing overflows at 320 px or at 125/150% text (1.4.4, 1.4.10). Checked at 320 px on all four screens: no horizontal scroll.
- "Esc zamyka" now works. Nav menus close on Esc, outside click, focus leaving and navigation, and only one opens at a time.
- Skip link is visible on the Navy hero. The language button's visible "PL" is part of its name (2.5.3).
- Result count is announced from an empty live region after the list changes (4.1.3).
- Comparison table keeps its table roles when stacked on phones; evidence rows have row headers; styled lists carry `role="list"`; no `display: contents` on the nav landmark.
- Sign-in errors move focus to the field and are tied to it.
- The credibility select and the Polish IP switch keep their value (they are now part of the URL state).
- Without JavaScript the hero panels stack and are all readable; "Pokaż wyniki" is a submit button.
- Hero rotation holds while the pointer or focus is on it; the pause button comes before the dots.
- Forced-colours mode keeps selected and current states. Selects are at least 16 px (no zoom on iOS).

Critique and UI craft
- Text links are underlined again (Tailwind's reset had removed it).
- Phone landing: both sign-in buttons are on the first screen.
- Search field is focused on the search screen; six tags instead of eight.
- Language and account buttons show a chevron; the phone menus open inside the screen.
- Sort keeps its place next to "Filtry" on phones; the sort choice survives a filter change made while a card is open.
- Pager has "Poprzednia" and "Następna".
- Optical fixes: close icon centred, pill insets, text-button edges, select arrows, icon stroke weight, score separators that no longer start a line, a divider above the sheet button.
- `#FFFFFF` literals replaced by the surface token.

Motion in the templates
- Hero panels cross-fade with overlap and an 8 px drift (600 ms) instead of a hard cut.
- Phone filter sheet rises in 300 ms and closes in 200 ms with a backdrop fade, also on a direct load.
- Menus and "Jak liczymy" reveal in 160 to 200 ms. Press feedback has an easing; text buttons and busy buttons do not scale.
- The list dips to 40% while a filter, sort or page change loads.
- Reduced motion: no slide, drift or scale; 140 to 150 ms fades stay.

### Not fixed, with the reason

| Item | Reason |
|---|---|
| Font sizes outside the type scale (about 17 places in `globals.css`), radius literals, token drift with `DESIGN.md` (still names Roboto Serif in §6, card expand 420 ms in §7) | One clean-up of `DESIGN.md` and the scale together, in the next stage |
| `lang` on card titles and summaries | Needs `titleLang` from the API; with the data wiring |
| Empty, error and rate-limited results states | Not in the templates; with the data wiring |
| The sheet opens only after the server answers | Optimistic open is part of the motion work |
| Fonts from Google with `display=swap` can shift lines mid-transition | Move to `next/font` before the page moves are judged |
| Display settings and language menu do nothing yet | Stage 4 |

### Plan for the page-to-page motion (from the animation review, for stage 4)

1. Import `motion.css` after fixing it: `--sweep-from` and `--hero-drift` are undefined, `app-page`, `app-canvas`, `app-footer` and the `.card` morph rules are dead in the new layout, root fades become static so the nav card does not flicker.
2. Search ↔ results: the bar is one named object (360 ms); title and tags sink, filters and the first six cards rise. Pieces need `:only-child` so they do not re-rise on same-route changes.
3. Card grows in place: a native view transition with three named parts (surface, content, bar). The surface grows with `clip-path` from the clicked tile's measured rectangle to the visible part of the column (380 ms open, 240 ms close), content fades from 120 ms, the bar rises last. Not a shared name between tile and panel (it would stretch the text). Keyed on the panel entering or leaving, so browser Back and Forward animate too.
4. Opening and closing: sign-in becomes a client submit so the navigation can carry the `opening` type; the sweep runs on the root snapshot from the hero's measured edge.
5. Filter, sort and page start no view transition; the dip above is enough.
6. Flow test asserts animation names and durations per move, normally and with reduced motion.

Open risks to check first: whether React runs layout effects before the browser captures the new state (the card growth depends on it); a view transition cannot reverse mid-flight; tall snapshots on phones; Safari and Firefox fall back to no motion.

### Not verified in this pass

No screen reader, no real phone, no forced-colours or 200% zoom rendering, no hover or focus screenshots. The checks that were run are scripted in headless Chrome: focus after open and Esc, filters without reload, sheet as dialog, 320 px reflow, zero console errors.

## Pass 2: wired build, 2026-11-22

Reviewed: the app on the live API, in three languages, with the new pages (Sources, Profile, text pages, registration in the sign-in card), the empty, error and missing-card states, and the page-to-page motion. Same four skills; the impeccable critique and better-ui ran as one review. Evidence: screenshots in `docs/design/templates/`, mid-transition frames at 10% speed in `docs/design/motion-frames/`, and the headless flow test `frontend/scripts/flow-test.mjs`.

### Results

| Review | Verdict before fixes | Findings |
|---|---|---|
| better-accessibility | Block: 3 serious. All pass-1 fixes confirmed still in place | 20 |
| impeccable critique + better-ui | 30/40 (pass 1: 27/40); better-ui approve | 19 |
| improve-animations | 3 high | 15 |

### Fixed

Accessibility
- Sign-in can no longer get stuck on "Sprawdzamy tożsamość…" after the same failure twice; both buttons are marked busy and the state is announced.
- A rejected registration keeps what was typed; required fields are announced as required, the role select says "Wybierz rolę", the terms link opens in a new tab.
- Focus goes to the page heading after a navigation that would otherwise lose it (menu links, search to results). "Źródła: n" on a tile now lands focus in the card.
- Failed and missing-card states have a heading, take focus, close with Esc, and the failed card offers a way back; a missing card has its own page title.
- "Zapisano" and "Konto usunięte" sit in status regions that exist before the text.
- Language can be chosen on the landing, before signing in.
- Phone filter sheet: the skip link is inert behind it; Esc works from a select.
- Delete account is checked on the server as well as in the browser.
- High contrast: borders also apply with the system setting; disabled controls are dashed; the current language is outlined.
- Quotes without a stated language are marked Polish; the "opens in a new tab" text is no longer read in the title's language.
- Ukrainian: the estimate badge is "Орієнтовно" (it was the same word as "Scores"); clearer strings for panel buttons, history rows and the current page.
- A filter chosen during another filter's 400 ms wait is no longer reverted.

Design
- Comparison table: our own column names (the same as on the card), a wider card column, mono only for numbers.
- Registration: the hero stays in place while the taller form scrolls.
- Empty search: a "Pokaż wszystkie karty" action and a hint without the filter clause; facet rows with zero results are muted.
- Accessibility statement no longer points to a footer that does not exist (three languages).
- Filter panel no longer grows wider in Ukrainian. Text pages: the box hugs its content and lists have markers. Pages align with the nav card's edge.
- Jump links: "Kto jeszcze" matches its section, "Historia" added. Profile label "Język treści kart"; consent hint sits with its checkbox. "Oceny:" has its colon and scores always start their own row.

Motion
- The card grow and shrink run only for the two typed navigations that measure the tile first. Every other way a card or the list appears or leaves (a filter change with a card open, a deep link, Back and Forward, card to card) is a 150 ms fade.
- Between app pages the window layer does not cross-fade, so the nav card never dips.
- The logo is one size through its flight and changes colour part-way (320 ms from 300 ms); on phones it fades out quickly.
- The card content fades in as the window opens; the shrink fades out at its end; the window's lower corners stay square where it meets the viewport edge.
- The search bar leaves quickly on pages without a bar. The opening's content starts at 300 ms.
- The scroll position is restored only when the list is the same one the card was opened from.

### Not fixed, with the reason

| Item | Reason |
|---|---|
| Opening: the sign-in card does not fade and the hero does not drift; no designed closing move on sign-out | Not built. The sweep, the logo flight and the content rise are. Needs a decision: build them or take them out of `DESIGN.md` §7 |
| Search to results: no 40 ms stagger of the first six cards | Not built; the list rises as one block |
| The list dip covers filters and sort, not the pager, chips or "Wyczyść filtry" | Those are plain links; needs a small link wrapper |
| `lang` on card text that falls back to another language | The API now sends one string per field without saying its language; needs a language field from the backend |
| Registration errors are not tied to the failing field | The page keeps the values and shows the message; field-level marking needs the API's error details mapped |
| Font sizes outside the type scale (19 places), radius literals | Changing them moves sizes away from the prototype (card title 21 to 20 px, search title up to 52 px). Needs Philip's call; the reviewer's replacement table is in this pass's report |
| `DESIGN.md` is out of date in many places (footer, band, colour field, compare, card page, Roboto Serif in §6, motion timings in §7, area colours swapped in §1) | It is Delta's document; one agreed rewrite is better than piecemeal edits. §2 and §5 were corrected for D12 and D6 |
| Sources table on phones scrolls sideways | Works, with a focusable scroll region; stacking it like the comparison table is polish |
| Mono face has no Cyrillic, so Ukrainian source lines mix two faces | Needs a Cyrillic mono (for example Roboto Mono) or acceptance |
| Fonts load from Google with `display=swap` | Move to `next/font` to avoid a swap mid-transition |

### Flow test (headless Chrome, 1440×900 and 390×844)

All checks pass on both sizes, with zero console errors: the gate, one-click demo sign-in with the opening sweep, search with the bar glide, the results list, a card opening in place with focus on its title and its own page title, all nine sections and the comparison table, Esc and "Wróć" returning focus to the card, filters in place with no card motion, a filter change with a card open, the nav back to search, the three languages (interface and card text), Sources, Profile and the three text pages without horizontal scroll, reduced motion (150 ms fades only), and the `/karta/<id>` redirect.

### Not verified

No screen reader, no real phone, no Safari or Firefox (they fall back to no motion), no forced-colours or 200% zoom rendering. Motion was judged from asserted animation names and durations plus one frame per move, not from watching it play. Once during testing the API answered a Ukrainian request with English card titles and a later request with Ukrainian; it did not recur, and looks like the backend translating on first request.
