# Pomysłownik design system (v1.0)

This file is the design reference for every Pomysłownik screen. The source of truth is the graphic charter in `docs/design/`:

| File | What it is |
|---|---|
| `docs/design/Identyfikacja wizualna.dc.html` | Brand identity board: logo, colours, type, graphic elements, usage rules, applications |
| `docs/design/Komponenty.dc.html` | UI components: buttons, forms, tags, result cards, navigation, messages, a11y checklist |
| `docs/design/tokens.css` | Brand tokens as CSS variables (rem, 1rem = 16px) |
| `docs/design/logo/*.svg` | Official logo set |
| `docs/design/screenshots/identyfikacja-wizualna.jpg` | Overview of the identity board |
| `docs/design/support.js` | Runtime the `.dc.html` boards load. Open the boards in a browser to view them |

> **Display font is Lato.** The boards default to Lato (Regular 400 + Bold 700), and all headings use Lato Bold 700.
> Three items in `docs/design/` are older than this change and still name Fraunces: `tokens.css` (`--font-display`), the screenshot, and the wordmark text inside the logo SVGs.
> Where they disagree with this file, follow this file. The logo SVGs are artwork: use them as they are, and convert the text to curves before printing.

Interface copy is in Polish, English and (from task F13) Ukrainian. Each screen is in one language only. Example content on screens is marked `[PRZYKŁAD]`.

> **Pending change (mentor feedback, 2026-11-22).** The palette moves towards PCI and Podkarpackie colours (PCI Navy `#001A49`, Deep blue `#035487`, blue-to-green band `#0085CC` → `#6BB437`), the type scale becomes one fluid scale, Roboto is added for Cyrillic, and high and low contrast modes are added.
> Proposal with measured contrast: `docs/MENTOR-FEEDBACK-2026-11-22.md` §5 and §6. Tasks D1, D2, F14, F17, F18. Until D1 is merged, the tables below still apply.

---

## 1. Logo

- **Concept B, "Połączenie" (connection).** Two nodes joined by an arc form the letter P: two innovators who found each other. It is one thick line and two circles, so it stays readable in one colour, even as a 16 px favicon.
- The line between the nodes sets the **55° angle**. Diagonal shapes across the system use this angle, and the arc returns in the radar motif.
- Sygnet path (viewBox `15 5 34 54`): `M22 52V21A11 11 0 1 1 36.4 31.46`, stroke 7, round caps, plus circles r=6 at (22,52) and (36.4,31.46).
- Wordmark: "Pomysłownik", display font, weight 580 (in Lato this renders as Bold 700), tracking −0.01em.

| Variant | File | Use |
|---|---|---|
| Primary | `pomyslownik-logo-podstawowe.svg` | Granat sygnet + Atrament text on Papier |
| Reversed | `pomyslownik-logo-odwrocone.svg` | Iskra sygnet + Papier text on Atrament |
| Mono black / white | `pomyslownik-logo-mono-czarne.svg` / `-mono-biale.svg` | One-colour print |
| Sygnet | `pomyslownik-sygnet.svg` | Standalone mark |
| Favicon | `favicon-16.svg`, `favicon-32.svg` | Browser tab |
| App icon | `app-icon-512.svg` (Granat), `app-icon-512-ciemna.svg` (Atrament + Iskra) | Radius 22% |

- **Clear space:** X on every side, where X = sygnet height / 4.
- **Minimum size:** full logo 120 px wide; sygnet/favicon 16 px.
- **Do:** logo on Papier, logo on Atrament, sygnet as an app icon.
- **Don't:** change the colours, skew or stretch it, add effects (shadow, glow), or write it in capitals (POMYSŁOWNIK).

## 2. Colour

### Core palette

| Token | Name | Hex | Role | Contrast |
|---|---|---|---|---|
| `--color-papier` | Papier | `#F7F2EB` | Backgrounds | n/a |
| `--color-atrament` | Atrament | `#141414` | Text, main elements | 16.54:1 on Papier |
| `--color-granat` | Granat | `#0085CC` | Main colour: PCI blue from the pcinn.org logo. Accent, buttons, links, focus | 3.61:1 on Papier, 4.02:1 with white |
| `--color-iskra` | Iskra | `#6BB437` | Highlight colour: PCI green from the pcinn.org logo. Only on Atrament or under Atrament text. **Never text on a light background** | 7.20:1 with Atrament |
| `--color-kamien` | Kamień | `#5A544D` | Secondary text | 6.71:1 on Papier |
| `--color-krawedz` | Krawędź | `#DDD5C8` | Card borders | n/a |

**Proportions:** Papier 60%, Atrament 25%, Granat 10%, Iskra 5%.

### Category colours (always shown with an icon and a name)

| Token | Category | Hex |
|---|---|---|
| `--color-uczelnie` | Uczelnie (universities) | `#A9DCE6` |
| `--color-patenty` | Patenty (patents) | `#D6E6A3` |
| `--color-laboratoria` | Laboratoria (labs) | `#CDB8F0` |
| `--color-startupy` | Startupy (startups) | `#F7C6A8` |

### Status and support colours

| Use | Hex |
|---|---|
| Success / "Tak" (`--color-tak`) | `#1F7A45`, background `#EDF5EF` |
| Error / "Nie" (`--color-nie`) | `#B42318`, background `#FBEDEB` |
| Info | border `#0085CC`, background `#E6F3FA` |
| Warning | border `#141414`, background `#EEF7E7`, Iskra triangle icon |
| Granat hover | `#006BA3` |
| Iskra hover | `#5A9A2E` |
| Disabled | background `#E9E2D7`, text `#5A544D` |
| Surface (cards, sections) | `#FFFFFF` |
| Dark-surface divider / code bg | `#3A3733` / `#2A2826` |
| Muted text on Atrament | `#E4DDD2` |

Status is always icon + word. Colour is never the only signal.

## 3. Typography

| Role | Family | Weights | Use |
|---|---|---|---|
| Display | **Lato** | Regular 400, Bold 700 | Headings, slogans, logo. Never weight 300 |
| Body | Atkinson Hyperlegible Next | Regular 400, Medium 500, Bold 700 | Text, interface, readability |
| Mono | Atkinson Hyperlegible Mono | Regular 400, Medium 500 | Dates, IDs, numbers, sources |

```css
--font-display: "Lato", "Segoe UI", Arial, sans-serif;
--font-body: "Atkinson Hyperlegible Next", system-ui, sans-serif;
--font-mono: "Atkinson Hyperlegible Mono", ui-monospace, monospace;
```

| Token | Size | Notes |
|---|---|---|
| `--text-h1` | 3rem (48px) | Boards use 42–56px, Lato Bold, leading 1.1, tracking −0.01em |
| `--text-h2` | 2rem (32px) | Section titles 26–30px, Lato Bold 700, leading 1.1 |
| `--text-h3` | 1.5rem (24px) | Card titles 22px, Lato Bold 700, leading 1.2 |
| `--text-min` | 1rem (16px) | Minimum running text |
| `--text-small` | 0.875rem (14px) | Captions, metadata, mono source lines |

- Body leading 1.5–1.6 (`--leading-body: 1.55`). Heading leading ≥ 1.1.
- Sub-headings inside a section (h3 labels): body font, 15px, weight 700.
- Section headings carry a Granat number prefix, for example `01.` (Iskra on Atrament surfaces).
- Big numbers (stat + source): Lato Bold 44px, then a body label, then a mono 14px Kamień source line such as `Źródło: POL-on · 30.09.2026 · metodologia`.

## 4. Shape, spacing, focus

| Token | Value |
|---|---|
| `--radius-card` | 1.5rem (24px): sections and panels |
| Result card radius | 20px; messages 16px; inputs 12px; tooltip 12px; avatar tile 14px |
| `--radius-pill` | 999px: buttons, chips, tags, search |
| `--radius-icon` | 22% (app icon) |
| `--border-card` | 1px solid Krawędź |
| `--space-1…6` | 4 / 8 / 12 / 16 / 20 / 24 px. Card gap 20px, card and board padding 24px |
| Focus | `outline: 3px solid #0085CC; outline-offset: 2px` on `:focus-visible` |

## 5. Graphic elements

- **Radar arcs:** concentric Papier rings on Atrament, fading out, with one Iskra arc.
- **55° split:** Granat/Iskra diagonal at the sygnet angle.
- **Connection network:** Atrament nodes and lines on Papier, with a central Granat node.
- **3D sygnet:** rounded Granat tile (gradient `#2B9BD9 → #0085CC → #006BA3`) on a soft Papier surface. Use it for illustration only, never as the logo.

## 6. Components

Rules from `Komponenty.dc.html`. All sizes are in px.

### Buttons (height 44, 36 in dense views; one primary button per view)

| Kind | Style |
|---|---|
| Primary | Granat bg, Papier text, bold, pill, padding 0 22. Hover `#006BA3` |
| Secondary | White bg, 1.5px Atrament border, Atrament text. Hover Papier |
| Text link button | Granat, bold, underline offset 4. Hover Atrament |
| Highlight (events) | Iskra bg, Atrament text. Hover `#5A9A2E` |
| Icon button | 44 circle; Atrament fill with Papier icon, or white with 1.5px Atrament border |
| Small | height 36, padding 0 16, 15px |
| Card action | height 40, padding 0 18, trailing arrow icon |
| Disabled | `#E9E2D7` bg, Kamień text |

### Forms

- The label is always above the field and bold. Hint text is 14px Kamień.
- Input/select: height 48, 1.5px Kamień border, radius 12, padding 0 14, white bg.
- Error: 2px `#B42318` border, `aria-invalid`, and a message that starts with **"Błąd:"** plus an error icon, in bold 14px red. Never colour alone.
- Search: pill, height 56, 1.5px Kamień border, Papier bg, leading search icon, primary "Szukaj" button inside. Placeholder: "Szukaj zespołów, patentów, laboratoriów…".
- Checkbox/radio: 20px, `accent-color: #0085CC`, min row height 28, grouped in a `fieldset` with a `legend`.
- Switch: 48×28 track with a 1.5px Granat border, 19px knob, and a visible state word next to it. `role="switch"`.

### Tags and badges

- **Category chip (filter):** pill, height 44, 30px Atrament circle with a Papier icon, then the name. When on: category colour bg, 2px Atrament border, check mark. When off: white bg, 1.5px Kamień border. `aria-pressed`.
- **Category tag (on card):** height 28, category bg, 20px Atrament icon circle, 14px bold.
- **Data status**, always icon + word:
  - *Potwierdzone* (confirmed): Atrament bg, Papier check icon.
  - *~ Szacunek* (estimate): 1.5px dashed Atrament border, mono `~`.
  - *Nieaktualne* (stale): 1.5px Kamień border, Kamień clock icon.
  - *Nowe* (new): Iskra bg, Atrament dot.
- **Keywords:** height 30, Papier bg, 1px Krawędź border, 15px regular. Overflow shown as `+N`.

Category icons (16×16, stroke 1.6–1.8, round caps/joins):

| Category | Path |
|---|---|
| Uczelnie | `M2 6.5L8 3l6 3.5Z M4.5 8v4M8 8v4M11.5 8v4M2.5 13.5h11` |
| Patenty | `M4 2h5.5L12.5 5v9h-8.5Z M6.5 8h4M6.5 11h4` |
| Laboratoria | `M6 2h4M7 2v4.5L3.2 13a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L9 6.5V2 M5 10.5h6` |
| Startupy | `M2 12l4-4 3 2.5L14 4.5 M10 4.5h4v4` |

### Result cards

Order inside a card: category tag (+ `[PRZYKŁAD]` when it is example data), title (Lato Bold 22), who · where (Kamień), data status, mono source with date, then one primary action plus a "Zapisz" (save) toggle.
Card: white, 1px Krawędź border, radius 20, padding 20, gap 12. Hover border Kamień. Grid `minmax(300px, 1fr)`, gap 20. Startup cards add a 48px Atrament tile with Iskra initials.

### Navigation

- **Top bar:** min height 64, white, 1px Krawędź border, radius 16. Sygnet + wordmark (22px), then links, then search icon button and avatar.
- **Active item:** bold + 3px Granat underline, never colour alone. Hover adds a Krawędź underline.
- **Tabs:** height 46, 3px Granat underline when selected, mono count pill on Papier.
- **Breadcrumb:** `/` separators in Kamień; current item bold with `aria-current="page"`.
- **Pagination:** 44 circles; current page Atrament bg with Papier text; others white with Krawędź border; mono numbers.

### Messages

Every message has an icon, a bold lead word and a colour. Tone: concrete and friendly. Padding 16, radius 16, 1.5px border.

| Kind | Lead word | Border / bg |
|---|---|---|
| Info | **Informacja.** | Granat / `#E6F3FA` |
| Success | **Gotowe.** | `#1F7A45` / `#EDF5EF` |
| Warning | **Uwaga.** | Atrament / `#EEF7E7` |
| Error | **Błąd.** | `#B42318` / `#FBEDEB` |

- **Tooltip:** Atrament bg, Papier text, radius 12, 15px, Iskra link, `role="tooltip"`.
- **Empty state:** 1px dashed Kamień border, radius 20, radar illustration, Lato Bold 22 title ("Nic nie znaleźliśmy dla „…”"), a hint, and a secondary "Wyczyść filtry" button.

## 7. Voice and positioning

- **Łączący (connecting).** Shows who works on what and how to meet.
- **Rzetelny (reliable).** Every number has a source and a date.
- **Otwarty (open).** For science, business, public administration and media.
- **Dostępny (accessible).** WCAG 2.2 AA, readable for everyone.

Tagline example: *Tu pomysły znajdują ludzi.*

### No em dashes

Em dashes (`—`, U+2014) must be removed. Do not use them in interface copy, headings, alt text, `aria-label`s, messages, metadata, or docs.

- Use a period and start a new sentence: "Tak. Logo na papierze."
- Use a colon for a label and its value: "Źródło: POL-on".
- Use the middle dot `·` to separate metadata: "Źródło: POL-on · 30.09.2026".
- Use a plain hyphen with spaces for a title separator: "Pomysłownik - Komponenty".

The reference boards in `docs/design/` still contain em dashes (for example "Tak — logo na papierze"). Do not copy them. Rewrite the text using the rules above.

## 8. Rules to remember

1. Use only the official logo files.
2. Keep the clear space.
3. Stick to the palette and the 60/25/10/5 proportions.
4. Lato for headings, Atkinson Hyperlegible for everything else.
5. Colour is never the only carrier of information.
6. Tone: concrete, friendly, reliable.
7. No em dashes (`—`) anywhere. See section 7.

## 9. Accessibility checklist (WCAG 2.2 AA)

Check every item before handing over a view.

1. Every control works with the keyboard. Focus is always visible.
2. Text and controls meet the required contrast. Colour is never the only signal.
3. Every form field has a visible label. Errors are described in text.
4. Rating bars and charts have a text or table version.
5. Set `lang` on the page and on every passage in another language.
6. Respect `prefers-reduced-motion`, `prefers-contrast` and `forced-colors`.
7. Run the automated test (`axe`) before opening a pull request.
8. WCAG 2.2 additions: focus is never hidden under the sticky header (2.4.11), targets are at least 24 by 24 px (2.5.8), help is in the same place on every page (3.2.6), no data is asked twice (3.3.7), sign-in needs no puzzle and allows paste (3.3.8).
9. Works at 200% text size and at 320 CSS px width (400% zoom) with no loss of content.
10. ARIA follows the WAI-ARIA Authoring Practices: native HTML first, `aria-expanded` on every disclosure, named `nav` landmarks, `lang` on every language name. Details: `docs/MENTOR-FEEDBACK-2026-11-22.md` §4.

## 10. Motion

One flow, forward and back: landing → opening → search → results → card. Spec: the flow prototype (artifact "Pomysłownik flow", motion spec table). Code: `frontend/src/components/motion/Motion.tsx` and the "Motion" block in `frontend/src/app/globals.css`.

- Every navigation carries a transition type; the CSS picks the move with `:active-view-transition-type(...)`. Each forward move has its reverse: opening / closing, search / to-search, open-card / nav-back, filter.
- Three shared objects tie the screens together: the logo (landing hero at 48 px ↔ header at 24 px), the search bar (centre of the search page ↔ top of the results) and each card (tile in the list ↔ header of its page).
- Opening (signature): the panel fades 160 ms, the Papier window sweeps open over the hero in 640 ms (80 ms delay), the hero drifts 12% under it, the logo flies 640 ms with a reversed → primary cross-fade; header, title, bar and chips rise from 460 ms with a 40 ms stagger. On phones the window sweeps up.
- Everything else is fast feedback: pieces sink in 120–140 ms and rise in 280 ms with a 40 ms stagger; the list dips to 40% and back on a filter change; a card grows into its page in 420 ms with a soft settle.
- Easing: out-expo `cubic-bezier(0.16, 1, 0.3, 1)`. Only transform, opacity and clip-path move.
- Reduced motion: a 120–160 ms cross-fade only. No flights, sweeps or rises.
- Every page still works without JavaScript (plain forms and links); the moves are an enhancement.

