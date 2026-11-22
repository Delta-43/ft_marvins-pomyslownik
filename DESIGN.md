# Pomysłownik! design system (v2.0)

The style guide for every Pomysłownik! screen. Source of truth for colour, type, space, shape, components, motion and accessibility. The brand charter by Alban (`docs/design/`) remains the source for the logo and its rules; the flow prototype by Delta is the source for behaviour. The frontend code (`frontend/src`) must match this file; a token used in code and missing here is a bug.

**Tagline.** Tu pomysły znajdują ludzi. Polish innovations from public sources, in one place, with a source and a date next to every number.

**Overview.** Papier paper tones carry the page. Atrament ink carries the words. PCI Navy carries dark surfaces and the one primary action on each screen. Deep blue carries links and focus. The PCI blue-to-green band is decoration only: it never carries text. Four pastel category colours always travel with an icon and a name. The look is calm and factual: flat surfaces, soft shadows for elevation, borders for structure, one accent at a time.

---

## 1. Colour palette

**Generated from the two logo colours only** (decision of 2026-11-23): PCI blue `#0085CC` (hue 243° in OKLCH) and green `#6BB437` (hue 135°). Every neutral is a blue-tinted tone of the first, success comes from the second, the three category tints are blue, green and the teal between them (hue 189°). The one exception is the error red, kept because an error must never read as a brand colour. Tones were set in OKLCH and checked with the WCAG 2.2 formula on 2026-11-23 (generator: lightness and chroma per role, gamut-clipped). AA needs 4.5:1 for text, 3:1 for large text and for component boundaries.

### Brand and neutrals

| Name | Hex | Token | Use | Contrast |
|---|---|---|---|---|
| PCI blue | `#0085CC` | `--color-pci` | Logo symbol, icons 24 px and up. Never small text | On white 4.02:1 (large and graphics only) |
| Iskra (logo green) | `#6BB437` | `--color-iskra` | Highlights on Navy only (hero kicker) | On Navy 5.29:1 |
| Navy | `#02314E` | `--color-navy` | Primary button, dark surfaces (hero) | White on it 13.53:1, Papier on it 12.62:1 |
| Navy hover | `#03446A` | `--color-navy-hover` | Primary button hover | White on it 10.3:1 |
| Deep blue | `#006095` | `--color-granat` | Links, focus ring, secondary button | On white 6.76:1, on Papier 6.3:1, on Mist 5.77:1 |
| Papier | `#F1F8FD` | `--color-papier` | Page background | Atrament on it 16.32:1 |
| Surface | `#FFFFFF` | `--color-surface` | Cards, panels, inputs | — |
| Mist | `#E1EFFB` | `--color-mist` | Tinted rows, selected chips, the current item | Atrament 14.95:1, Kamień 5.83:1 |
| Atrament | `#0A1B28` | `--color-atrament` | Text, headings, icons | On white 17.5:1 |
| Kamień | `#4A5D6D` | `--color-kamien` | Secondary text, control borders | On white 6.82:1, on Papier 6.36:1 |
| Krawędź | `#D0DBE3` | `--color-krawedz` | Hairlines (structure only, never a required boundary) | 1.41:1 on white |
| Disabled | `#E0E7EE` | `--color-disabled` | Disabled controls | Kamień on it 5.47:1 |
| Muted on dark | `#D1E0EE` | `--color-muted-dark` | Secondary text on Navy | On Navy 10.06:1 |
| Dark line | `#2E516B` | `--color-dark-line` | Dividers on dark | — |

### Status (always icon plus word)

| Name | Hex | Token | Use | Contrast |
|---|---|---|---|---|
| Tak (success, from the green) | `#40731A` | `--color-tak` | "Potwierdzone", "najlepsza", yes marks | White on it 5.7:1, on Papier 5.31:1 |
| Tak tint | `#E9F7E3` | `--color-tak-bg` | Success message background | Atrament on it 15.73:1 |
| Nie (error, the exception) | `#B42318` | `--color-nie` | Error text and borders | On white 6.57:1 |

### Categories (always with the icon and the name)

| Area | Hex | Token | Contrast |
|---|---|---|---|
| Technological (blue tint) | `#A0D1F8` | `--color-laboratoria` | Atrament on it 11.9:1 |
| Educational (green tint) | `#C3E8AF` | `--color-uczelnie` | Atrament on it 12.9:1 |
| Administrative (teal, between the two) | `#A1E7E1` | `--color-patenty` | Atrament on it 12.52:1 |

The token names are kept from v2.0 so the code did not need renaming; the values are new. The hero artwork is drawn through `mix-blend-mode: luminosity`, so it takes the Navy's hue.

### Contrast modes

| Mode | Trigger | Changes |
|---|---|---|
| Standard | default | As above |
| High | account menu, `prefers-contrast: more` | Papier → white, Mist → white, Kamień → `#303F4C`, no colour field, no blur, 2 px Atrament borders on cards and inputs, links underlined everywhere, focus ring 3 px Atrament with white halo |
| Low | account menu, `prefers-contrast: less` | Papier `#EAF1F8` page, Atrament → `#1E2D39`, Kamień stays (6.0:1), shadows lighter. Every text pair still ≥ 4.5:1 |
| Forced colours | `forced-colors: active` | System colours; borders kept with `border: 1px solid transparent` under shadows; badges keep their text |

---

## 2. Typography

Three families plus two Cyrillic companions, all EUPL-compatible (SIL OFL; Roboto Mono Apache 2.0), loaded from Google Fonts with `display=swap`.

| Role | Family | Weights | Fallback stack | Use |
|---|---|---|---|---|
| Display | **Lato** | 700 | `"Lato", "Roboto", "Segoe UI", Arial, sans-serif` | Headings, the wordmark, display numbers. Never weight 300 |
| Body | **Atkinson Hyperlegible Next** | 400, 500, 700 | `"Atkinson Hyperlegible Next", "Roboto", system-ui, sans-serif` | Everything else. Designed for low-vision readers |
| Technical | **Atkinson Hyperlegible Mono** | 400, 500 | `"Atkinson Hyperlegible Mono", "Roboto Mono", ui-monospace, monospace` | Scores, counts, TRL, dates, ids, source lines, evidence queries. Always upright, tabular numbers. As in the flow prototype (decision D12, 2026-11-22) |
| Cyrillic | **Roboto** | 400, 700 | — | Loaded with the Cyrillic subset so Ukrainian text never falls back to a system font |
| Cyrillic technical | **Roboto Mono** | 400, 500 | — | Second in `--font-tech`: Atkinson Hyperlegible Mono has no Cyrillic, so Ukrainian dates and source lines take their Cyrillic glyphs from one mono face instead of a system font. The browser fetches it only for those glyphs |

### Type scale

One modular scale, ratio 1.25, fluid with `clamp()`. Body is 17 px. Line length 60 to 75 characters for running text (`max-width: 68ch`).

| Step | Token | Size | Weight | Line height | Letter spacing | Use |
|---|---|---|---|---|---|---|
| Display | `--text-display` | `clamp(2.75rem, 1.5rem + 4vw, 5rem)` | 700 | 1.08 | −0.01em | Landing hero title only |
| H1 | `--text-h1` | `clamp(2.25rem, 1.5rem + 3vw, 3.25rem)` | 700 | 1.1 | −0.01em | One per page |
| H2 | `--text-h2` | `clamp(1.75rem, 1.2rem + 2vw, 2.25rem)` | 700 | 1.15 | −0.01em | Section titles |
| H3 | `--text-h3` | `1.5rem` | 700 | 1.2 | 0 | Card titles, panel titles |
| H4 | `--text-h4` | `1.25rem` | 700 | 1.3 | 0 | Sub-sections, result card titles on phones |
| Lead | `--text-lead` | `1.25rem` | 400 | 1.5 | 0 | Intro paragraphs |
| Body | `--text-body` | `1.0625rem` | 400 | 1.55 | 0 | Running text, form fields |
| Small | `--text-small` | `0.9375rem` | 400 | 1.5 | 0 | Hints, metadata, chips |
| Caption | `--text-caption` | `0.8125rem` | 500 | 1.4 | 0.02em | Badges, table captions. Never below 13 px |
| Eyebrow | `--text-eyebrow` | `0.875rem` | 700 | 1.3 | 0.18em | Uppercase labels above a title |
| Stat | `--text-stat` | `clamp(2rem, 1.5rem + 1.5vw, 2.75rem)` | 600 (Roboto Serif) | 1 | 0 | Display numbers |

Rules: `text-wrap: balance` on headings, `text-wrap: pretty` on paragraphs, `font-variant-numeric: tabular-nums` on every number, no all-caps except eyebrows, no italics for technical values. Under the 125% and 150% text-size settings the root font size scales and every `rem` follows.

---

## 3. Spacing and shape

### Spacing

Base 4 px. Tokens map to Tailwind's scale.

| Token | Value | Use |
|---|---|---|
| `--space-1` | 4 px | Icon gaps |
| `--space-2` | 8 px | Inside chips, between badge and text |
| `--space-3` | 12 px | Card content gap, form hint gap |
| `--space-4` | 16 px | Message padding, phone gutter |
| `--space-5` | 20 px | Card padding, grid gap |
| `--space-6` | 24 px | Panel padding, section inner gap |
| `--space-8` | 32 px | Between blocks inside a section |
| `--space-12` | 48 px | Between sections |
| `--space-16` | 64 px | Section padding on desktop |

Page gutter `clamp(1rem, 4vw, 3rem)`. Content width 72 rem (1152 px) for app pages, 90 rem for the landing. More space between sections than inside them.

### Radius

Outer radius = inner radius + padding where surfaces nest.

| Element | Radius | Token |
|---|---|---|
| Buttons, chips, search bar, badges | 999 px | `--radius-pill` |
| Inputs, selects, small tiles | 12 px | `--radius-input` |
| Messages, evidence rows | 16 px | `--radius-message` |
| Result cards, popovers, menus | 20 px | `--radius-card` |
| Panels, sign-in card, card page header | 24 px | `--radius-panel` |
| Sections on the landing, the hero image | 32 px | `--radius-section` |
| App icon | 22% | `--radius-icon` |

### Shadows

Shadows show elevation. Borders show structure. A surface uses one or the other, with `border: 1px solid transparent` kept under every shadow ring for forced-colours mode.

| Level | Token | Value | Use |
|---|---|---|---|
| 0 | — | none, 1 px Krawędź border | Result cards at rest, inputs (Kamień border) |
| 1 | `--shadow-1` | `0 1px 2px rgb(20 20 20 / 0.06), 0 1px 1px rgb(20 20 20 / 0.04)` | Chips, badges on images |
| 2 | `--shadow-2` | `0 2px 6px rgb(20 20 20 / 0.06), 0 12px 32px -12px rgb(0 26 73 / 0.18)` | Result card hover, the search bar, panels |
| 3 | `--shadow-3` | `0 8px 24px -8px rgb(0 26 73 / 0.22), 0 24px 56px -24px rgb(0 26 73 / 0.3)` | The floating sign-in card, menus, the compare basket |
| Focus | `--focus-ring` | `0 0 0 3px #035487` outside, `0 0 0 5px #FFFFFF` halo on dark | Every `:focus-visible` |

---

## 4. Surfaces

| Level | Background | Border | Purpose |
|---|---|---|---|
| Page | Papier `#F7F2EB` | — | The app pages, with the colour field behind |
| Section tint | Mist `#E7EFF5` | — | Numbers strip, how it works |
| Card | Surface `#FFFFFF` | 1 px Krawędź | Result cards, panels, forms |
| Floating | Surface `#FFFFFF` | none, shadow 3 | Sign-in card, compare basket, menus |
| Dark | Navy `#001A49` | Dark line | Landing hero, footer, pressed primary |
| Deep dark | Atrament `#141414` | Dark line | Landing lower sections (constellation, call to action) |

Glass (translucent, blurred) surfaces are allowed only on the landing page behind artwork, never behind running text. App pages use solid surfaces.

---

## 5. Layout

- **Landing:** two halves from 1080 px: dark hero 7/13 left, Papier 6/13 right with the floating card. Below, sections at 90 rem with a 1-column flow and a section number in outlined display type. On phones the hero is 70 svh, then the card, then the sections.
- **App header:** sticky, 64 px, Surface with the 4 px band on top. Logo (24 px wordmark) left, nav links, language and account right. On phones the links are behind a "Menu" disclosure. Content below carries `scroll-padding-top: 4.5rem`.
- **Search:** one centred column of 48 rem. Bar 56 px tall, 46 rem wide.
- **Results:** 272 px filter column from 821 px, cards in **one column** of wide collapsed cards with 14 px gaps, as in the flow prototype (decision D6, 2026-11-22). The open card takes the place of the list in that column. On phones the filters open as a bottom sheet from a "Filtry" button.
- **Card:** one column of 64 rem; assessment grid 2 columns from 768 px.
- **Compare:** horizontal-scrolling table from 768 px; one stacked block per card below.
- Breakpoints: 640, 768, 1024, 1080 (landing split), 1280.

---

## 6. Components

Each component lists its states. Hover styles sit behind `@media (hover: hover)`. Every control is at least 24 × 24 px; primary actions 44 px tall.

### Primary button
Navy background, white text, Lato 700 17 px, pill, 44 px (56 px on the landing card), padding 0 22 px. Hover `#03446A`. Active `scale(0.985)`, 100 ms. Focus ring. Disabled: `#E0E7EE` bg, Kamień text, `aria-disabled` when it must stay focusable (busy). Busy: spinner 18 px plus a label change ("Sprawdzamy tożsamość…"). One per screen.

### Secondary button
White background, 1.5 px Deep blue border, Deep blue text, pill, 44 px. Hover Mist background. Active as primary.

### Text link
Deep blue, underline offset 4 px, 700 inside sentences only when it is an action. Hover Navy. On dark: Papier with Iskra underline. Visited is not distinguished (every link is an app route).

### Icon button
44 px circle, Atrament icon 1.5 px stroke on transparent; hover Mist. Always an `aria-label`.

### Chip (filter, tag)
Pill, 36 px (32 px in dense lists), Surface, 1 px Krawędź, Small text. Selected: Mist background, 1.5 px Deep blue border, check icon. Removable chip: a button named "Usuń filtr: …" with an × icon, 24 px target. Hover Papier.

### Search bar
Pill, 56 px, Surface, 1.5 px Kamień border, leading 22 px search icon in Kamień, body text 19 px, primary button inside with 6 px inset. Focus: 3 px Deep blue ring. The bar is one object across the search and results screens (`view-transition-name: search-bar`).

### Input, select, textarea
48 px, 1.5 px Kamień border, 12 px radius, Surface, padding 0 14 px, body text. Label above, 700. Hint 15 px Kamień below. Focus ring. Error: 2 px Nie border, `aria-invalid`, message "Błąd: …" in 700 15 px Nie with an icon, `aria-describedby`. Paste always allowed, `autocomplete` set.

### Checkbox, radio
20 px, `accent-color: #035487`, row min-height 28 px, label and control share one hit area. Grouped in `fieldset` with a visible `legend`.

### Switch
48 × 28 px track, 1.5 px Deep blue border, 19 px knob, `role="switch"`, the state word next to it.

### Badges
- **Area tag:** 28 px pill, category colour, 20 px Atrament icon circle, Caption 700.
- **Potwierdzone:** Tak background, white check icon and word.
- **≈ Szacunek:** dashed 1.5 px Atrament border, white, mono tilde.
- **Dawno nie sprawdzano:** 1.5 px Kamień border, clock icon.
- **Nowe:** Iskra background, Atrament dot and word.
- **Tryb demo:** Iskra background, Atrament text, in the header.

### Result card (collapsed)
Surface, 1 px Krawędź, 20 px radius, padding 20 px, gap 12 px. Order: area tag and status badges, title (H4, the link that opens the card, hit area the whole tile), organisation (Kamień), two-line summary, meta row (level with basis badge, TRL, credibility), footer (sources count link, compare checkbox). Hover: border Kamień, shadow 2, lift 2 px. Focus-within: ring on the tile. The tile has `view-transition-name: karta-{id}`.

### Card page header
Surface, 24 px radius, padding 32 px, shadow 2: tags, H1, organisation and region, summary, "≈ Szacunek" note, primary button. Same `view-transition-name` as its tile.

### Assessment panel
Surface, 24 px radius, padding 24 px: H4 label, value in Roboto Serif 600 28 px, basis badge, "Źródło: [1], [2]" links, method line, evidence disclosure (`<details>` with `aria-expanded` through the native summary).

### Score
A number "62/100" in Roboto Serif, never a bar without the number. "Brak danych (n = 2)" when `insufficientData`.

### Messages
Padding 16 px, 16 px radius, 1.5 px border, icon, bold lead word. Info (Deep blue / Mist), Success (Tak / `#EDF5EF`), Warning (Atrament / `#FFF4D6`), Error (Nie / `#FBEDEB`).

### Navigation
Header links: body 500, 10 px 12 px, hover Krawędź underline, current page 700 with a 3 px Deep blue underline and `aria-current="page"`. Phone menu: native `<details>`, summary with the word "Menu" and the icon. Footer: dark Navy, links in Papier, "Pomoc i kontakt" always in the same position, language switch and display settings.

### Pagination
44 px circles, Roboto Serif numbers, current page Navy with white text and `aria-current`, others Surface with Krawędź border. `nav` named "Strony wyników".

### Filter panel
`<form>` with `fieldset` per group and a visible legend; counts in Roboto Serif Kamień; "Filtruj" primary (small) and "Wyczyść" link; from 1024 px a sticky column, below a bottom sheet (`<dialog>`) opened by "Filtry (n)".

### Compare basket
Floating bar at the bottom, Surface, shadow 3: "Zaznaczono 2 z 4", the chosen titles as removable chips, "Porównaj" primary. A live region announces changes.

### Loading
A 4 px band at the top of the viewport (Deep blue) plus a polite "Ładowanie…" announcement. The current page stays visible; no skeleton overlay.

### Empty, error, rate limited
A panel with a bold lead, one sentence that says the next step, and one action (clear filters, retry, wait n seconds). The `requestId` in Caption Kamień.

---

## 7. Motion

Spec: the flow prototype (Delta, 21.11.2026). Easing `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) for every enter and move; `ease-in` 120 to 160 ms for exits only. Only `transform`, `opacity` and `clip-path` animate.

| Moment | What moves | Duration |
|---|---|---|
| Sign-in feedback | Button label swaps to a spinner and "Sprawdzamy tożsamość…"; "Gotowe." in place | 150 ms swap |
| Field error | Nothing moves. Border, message, focus to the field | 0 |
| Opening (signature) | Sign-in card fades; the Papier window sweeps open over the hero (`clip-path`); the hero drifts 12% left and fades; the logo flies into the header (shared name) with a reversed → primary cross-fade; header, title, bar and chips rise with a 40 ms stagger once the window is open | fade 160 · sweep 640 (delay 80) · logo 640 · content 280 (from 460) |
| Closing | The same, reversed, from the header logo | 560 |
| Search → results | Bar glides to the top (shared name); title and chips sink; filters and the first cards rise with a 40 ms stagger | bar 360 · sink 120 · rise 280 |
| Filter, sort, page | List dips to 40% and back; cards that stay keep their place | 150 |
| Card expand | The tile grows into the card header (shared name) with a soft settle; sections rise under it | 420 · sections from 120 |
| Card collapse | Reverse; focus returns to the tile | 320 |
| Hover, press | Border and lift 150 to 200 ms; press `scale(0.985)` 100 ms | — |
| Phone filter sheet | Rises from the bottom 300 ms, closes with Esc, backdrop or "Pokaż wyniki" | 300 |
| Landing hero panels | Feature panels cross-fade and drift 8 px every 6 s; a visible pause control | 600 |

Reduced motion: no sweep, drift, flight, rise or slide. Cross-fades of 120 to 160 ms only. Autoplaying panels stop.

---

## 8. Accessibility rules (WCAG 2.2 AA)

1. Native elements first: `<button>`, `<a href>`, `<details>`, `<dialog>`, `<fieldset>`. ARIA only where HTML has no element.
2. One `h1` per page. Landmarks: one `main`, `header`, `footer`, every `nav` named. A skip link is the first focusable element.
3. After a client navigation, `document.title` updates and focus moves to the `h1`.
4. Every control has a visible focus ring (3 px Deep blue, 3:1 against every neighbour) and a target of 24 px or more; primary actions 44 px.
5. Every form field has a visible label, `autocomplete` where it applies, paste allowed; errors are text with "Błąd:", `aria-invalid` and `aria-describedby`; focus goes to the first invalid field.
6. Status is icon plus word. Colour never carries meaning alone. Scores are numbers, never bars alone.
7. Live regions: `role="status"` for result counts and loading, `role="alert"` for errors only, rendered empty before their text appears.
8. `lang` on `<html>` and on every passage in another language (`passageLang`, `titleLang`, language names in the switch).
9. `scroll-padding-top` equal to the sticky header on every app page.
10. Text size 100/125/150% and contrast standard/high/low in the footer, kept in a cookie, rendered on the server. `prefers-contrast`, `prefers-reduced-motion`, `prefers-reduced-transparency` and `forced-colors` honoured.
11. Reflows at 320 px with no horizontal scroll; survives 200% text size; `maximum-scale` never set.
12. Every screen works without JavaScript.
13. Help and contact sits in the same footer place on every page.

---

## 9. Do and don't

**Do**
- One primary action per screen.
- Show the source and the date next to every number.
- Keep the logo as artwork; do not recolour it beyond the Navy swap.
- Use the band as decoration above the header.
- Write plainly; explain "TRL" the first time it appears.

**Don't**
- Put text on the band or on Iskra over a light surface.
- Use PCI blue for small text.
- Use blur behind running text.
- Use colour as the only signal.
- Add a feature from the exclusions: idea submission, social features, crowdfunding, financing, investor matching.
- Use em dashes in copy.

---

## 10. Quick start

```css
@theme {
  /* Generated from the logo blue #0085CC and green #6BB437 (section 1). */
  --color-papier: #F1F8FD; --color-surface: #FFFFFF; --color-mist: #E1EFFB;
  --color-atrament: #0A1B28; --color-kamien: #4A5D6D; --color-krawedz: #D0DBE3; --color-disabled: #E0E7EE;
  --color-navy: #02314E; --color-navy-hover: #03446A; --color-granat: #006095; --color-pci: #0085CC; --color-iskra: #6BB437;
  --color-tak: #40731A; --color-tak-bg: #E9F7E3; --color-nie: #B42318; --color-nie-bg: #FBEDEB;
  --color-laboratoria: #A0D1F8; --color-uczelnie: #C3E8AF; --color-patenty: #A1E7E1;
  --font-display: "Lato", "Roboto", "Segoe UI", Arial, sans-serif;
  --font-body: "Atkinson Hyperlegible Next", "Roboto", system-ui, sans-serif;
  --font-tech: "Atkinson Hyperlegible Mono", "Roboto Mono", ui-monospace, monospace;
  --radius-pill: 999px; --radius-input: 0.75rem; --radius-message: 1rem; --radius-card: 1.25rem; --radius-panel: 1.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
/* Sizes are in rem everywhere, so the text-size setting scales boxes, gaps and radii with the text. */
```
