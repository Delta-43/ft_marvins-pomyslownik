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
> The screenshot and the wordmark text inside the logo SVGs are older than this and still show Fraunces.
> Where they disagree with this file, follow this file. The logo SVGs are artwork: use them as they are, and convert the text to curves before printing.

> **Palette v2 (task D1, 2026-11-22): PCI and Podkarpackie colours.** Section 2 is the source of truth. The `.dc.html` boards still show the v1 palette (Granat `#1B3F8F`, Papier `#F7F2EB`). Follow this file, not the boards.
> Still pending from the mentor feedback: one fluid type scale (D2), Roboto for Cyrillic (F13), high and low contrast modes (F14). Details: `docs/MENTOR-FEEDBACK-2026-11-22.md` §5 and §6.

Interface copy is in Polish, English and (from task F13) Ukrainian. Each screen is in one language only. Example content on screens is marked `[PRZYKŁAD]`.

---

## 1. Logo

- **Concept B, "Połączenie" (connection).** Two nodes joined by an arc form the letter P: two innovators who found each other. It is one thick line and two circles, so it stays readable in one colour, even as a 16 px favicon.
- The line between the nodes sets the **55° angle**. Diagonal shapes across the system use this angle, and the arc returns in the radar motif.
- Sygnet path (viewBox `15 5 34 54`): `M22 52V21A11 11 0 1 1 36.4 31.46`, stroke 7, round caps, plus circles r=6 at (22,52) and (36.4,31.46).
- Wordmark: "Pomysłownik", display font, weight 580 (in Lato this renders as Bold 700), tracking −0.01em.

| Variant | File | Use |
|---|---|---|
| Primary | `pomyslownik-logo-podstawowe.svg` | Granat sygnet + Atrament text on white |
| Reversed | `pomyslownik-logo-odwrocone.svg` | Iskra sygnet + white text on Granat |
| Mono black / white | `pomyslownik-logo-mono-czarne.svg` / `-mono-biale.svg` | One-colour print |
| Sygnet | `pomyslownik-sygnet.svg` | Standalone mark |
| Favicon | `favicon-16.svg`, `favicon-32.svg` | Browser tab |
| App icon | `app-icon-512.svg` (Granat), `app-icon-512-ciemna.svg` (Atrament + Iskra) | Radius 22% |

- **Clear space:** X on every side, where X = sygnet height / 4.
- **Minimum size:** full logo 120 px wide; sygnet/favicon 16 px.
- **Do:** logo on white or Mgła, logo on Granat, sygnet as an app icon.
- **Don't:** change the colours, skew or stretch it, add effects (shadow, glow), or write it in capitals (POMYSŁOWNIK).

## 2. Colour

Palette v2 (task D1) follows Podkarpackie Centrum Innowacji (PCI) and the Podkarpackie region. The colours were measured on pcinn.org and podkarpackie.pl (mentor feedback §5).
Every contrast number below uses the WCAG 2.x formula. AA needs 4.5:1 for normal text, 3:1 for large text (24 px, or 18.66 px bold) and 3:1 for focus rings, borders of controls and icons.

### Core palette

| Token | Name | Hex | Role | Contrast |
|---|---|---|---|---|
| `--color-papier` | Papier | `#FFFFFF` | Page and card background (was `#F7F2EB`) | n/a |
| `--color-mgla` | Mgła | `#E7EFF5` | Section backgrounds, search field, keyword pills, info messages. PCI light surface | Atrament 15.85:1, Granat 14.52:1 |
| `--color-mgla-2` | Mgła 2 | `#DEE7EF` | Second surface: hover on secondary buttons, count pills, disabled buttons | Atrament 14.72:1, Kamień 5.97:1 |
| `--color-atrament` | Atrament | `#141414` | Body text, icons, outlines of secondary buttons | 18.42:1 on white |
| `--color-granat` | Granat | `#001A49` | **PCI Navy.** Headings, primary buttons, header and footer surfaces, dark panels, logo (was `#1B3F8F`) | 16.88:1 on white, white text 16.88:1 |
| `--color-glebia` | Głębia | `#035487` | **PCI Deep blue.** Links, text buttons, focus ring, active nav and tab underline, primary hover, checkbox accent | 8.01:1 on white, 6.89:1 on Mgła, white text 8.01:1 |
| `--color-blekit` | Błękit | `#0177FD` | PCI Bright blue. Large text (24 px and up), icons, borders. **Never small text** | 4.15:1 on white |
| `--color-iskra` | Iskra | `#FFD93D` | The one warm accent. Highlights on Granat, or behind Atrament text. **Never text on a light background** | 12.25:1 on Granat, 13.37:1 with Atrament |
| `--color-kamien` | Kamień | `#5A544D` | Secondary text, input borders | 7.47:1 on white, 6.43:1 on Mgła |
| `--color-stal` | Stal | `#98AEC5` | PCI Steel. Card borders and dividers (decoration), muted text on Granat | 2.28:1 on white, 7.39:1 on Granat |
| `--color-krawedz` | Krawędź | `#98AEC5` | Card borders. Same value as Stal (was `#DDD5C8`); the old name is kept so existing code still works | 2.28:1 on white |

**Regional band** (`--gradient-pasmo`): `linear-gradient(90deg, #0085CC, #6BB437)`, the PCI logo blue flowing into green, like the Podkarpackie "przestrzeń otwarta" hill. Use it as one thin band (4 px) at the top of the header and on the landing art. **Decoration only: never put text on it, and never use `#0085CC` (4.02:1 on white) or `#6BB437` (2.56:1) for text, buttons, links or focus.** `#6BB437` may appear on Granat (6.60:1) as decoration.

**Proportions:** Papier and Mgła 60%, Atrament 20%, Granat and Głębia 15%, Iskra and the band 5%.

### Category colours (always shown with an icon and a name)

| Token | Category | Hex | Atrament text on it |
|---|---|---|---|
| `--color-uczelnie` | Uczelnie (universities) | `#A9DCE6` | 12.34:1 |
| `--color-patenty` | Patenty (patents) | `#E3EDA0` (was `#D6E6A3`) | 14.81:1 |
| `--color-laboratoria` | Laboratoria (labs) | `#CDB8F0` | 10.27:1 |
| `--color-startupy` | Startupy (startups) | `#F7C6A8` | 11.93:1 |

**Colour-blindness check** (Machado 2009 simulation, CIE76 ΔE between the closest pair; under 10 can look alike):

| Vision | v1 closest pair | v2 closest pair |
|---|---|---|
| Normal | Patenty/Startupy 31.4 | Patenty/Startupy 33.0 |
| Protanopia | Patenty/Startupy 16.2 | Uczelnie/Laboratoria 20.8 |
| Deuteranopia | **Patenty/Startupy 7.7 (fail)** | Uczelnie/Laboratoria 13.6 (Patenty/Startupy now 13.8) |
| Tritanopia | Patenty/Laboratoria 15.6 | Patenty/Laboratoria 17.2 |

Patenty moved to a lighter, yellower green (ΔE 6.1 in normal vision) so it no longer merges with Startupy under deuteranopia. The icon and the name still carry the meaning; colour only helps.

### Status and support colours

| Use | Value | Contrast |
|---|---|---|
| Success / "Tak" (`--color-tak`) | `#027641` Podkarpackie green (was `#1F7A45`), background `#E6F2EC` | 5.72:1 on white, 4.98:1 on its background |
| Error / "Nie" (`--color-nie`) | `#B42318`, background `#FBEDEB` | 6.57:1 on white, 5.77:1 on its background |
| Info | border Głębia, background Mgła | Atrament text 15.85:1 |
| Warning | border Atrament, background `#FFF6CC`, Iskra triangle with Atrament outline. On white, a warning icon may use Podkarpackie orange `#EF6D00` (3.06:1, icons and large text only) | Atrament text 16.94:1 |
| Granat hover (primary button) | Głębia `#035487` | white text 8.01:1 |
| Link hover | Granat `#001A49` | 16.88:1 |
| Iskra hover | `#F5CC1F` | Atrament text 11.88:1 |
| Disabled | background Mgła 2, text Kamień | 5.97:1 (exempt, still readable) |
| Surface (cards) | white on Mgła sections, or white with a Stal border | n/a |
| On Granat surfaces | text white (16.88:1), muted text Stal (7.39:1), links and focus Iskra (12.25:1), dividers Głębia (decoration) | |

Status is always icon + word. Colour is never the only signal.

**Pairs that must not be used:** Głębia on Granat for text or focus (2.11:1); Bright blue on Granat for small text (4.07:1, large text and icons only); `#0085CC` for any text or control (4.02:1 on white); `#6BB437` on a light background (2.56:1 on white); Iskra on white or Mgła; text on the regional band.

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
- Headings are Granat on light surfaces and white on Granat surfaces. Body text stays Atrament.
- Section headings carry a Głębia number prefix, for example `01.` (Iskra on Granat surfaces).
- Big numbers (stat + source): Lato Bold 44px, then a body label, then a mono 14px Kamień source line such as `Źródło: POL-on · 30.09.2026 · metodologia`.

## 4. Shape, spacing, focus

| Token | Value |
|---|---|
| `--radius-card` | 1.5rem (24px): sections and panels |
| Result card radius | 20px; messages 16px; inputs 12px; tooltip 12px; avatar tile 14px |
| `--radius-pill` | 999px: buttons, chips, tags, search |
| `--radius-icon` | 22% (app icon) |
| `--border-card` | 1px solid Krawędź (Stal) |
| `--space-1…6` | 4 / 8 / 12 / 16 / 20 / 24 px. Card gap 20px, card and board padding 24px |
| Focus | `outline: 3px solid #035487; outline-offset: 2px` on `:focus-visible` (Głębia, 8.01:1 on white). On Granat surfaces use Iskra `#FFD93D` (12.25:1) |

## 5. Graphic elements

- **Regional band:** the 4 px blue-to-green band (`--gradient-pasmo`) at the top of the header. Decoration only.
- **Radar arcs:** concentric white rings on Granat, fading out, with one Iskra arc.
- **55° split:** Granat/Iskra diagonal at the sygnet angle.
- **Connection network:** Atrament nodes and lines on white or Mgła, with a central Głębia node.
- **3D sygnet:** rounded tile (gradient Głębia `#035487` → Granat `#001A49`) on a soft Mgła surface. Use it for illustration only, never as the logo.

## 6. Components

Rules from `Komponenty.dc.html`. All sizes are in px.

### Buttons (height 44, 36 in dense views; one primary button per view)

| Kind | Style |
|---|---|
| Primary | Granat bg, white text, bold, pill, padding 0 22. Hover Głębia |
| Secondary | White bg, 1.5px Atrament border, Atrament text. Hover Mgła 2 |
| Text link button | Głębia, bold, underline offset 4. Hover Granat |
| Highlight (events) | Iskra bg, Atrament text. Hover `#F5CC1F` |
| Icon button | 44 circle; Granat fill with white icon, or white with 1.5px Atrament border |
| Small | height 36, padding 0 16, 15px |
| Card action | height 40, padding 0 18, trailing arrow icon |
| Disabled | Mgła 2 bg, Kamień text |

### Forms

- The label is always above the field and bold. Hint text is 14px Kamień.
- Input/select: height 48, 1.5px Kamień border, radius 12, padding 0 14, white bg.
- Error: 2px `#B42318` border, `aria-invalid`, and a message that starts with **"Błąd:"** plus an error icon, in bold 14px red. Never colour alone.
- Search: pill, height 56, 1.5px Kamień border, Mgła bg, leading search icon, primary "Szukaj" button inside. Placeholder: "Szukaj zespołów, patentów, laboratoriów…". Focus ring solid Głębia, never a transparent tint.
- Checkbox/radio: 20px, `accent-color: #035487` (Głębia), min row height 28, grouped in a `fieldset` with a `legend`.
- Switch: 48×28 track with a 1.5px Głębia border, 19px knob, and a visible state word next to it. `role="switch"`.

### Tags and badges

- **Category chip (filter):** pill, height 44, 30px Atrament circle with a white icon, then the name. When on: category colour bg, 2px Atrament border, check mark. When off: white bg, 1.5px Kamień border. `aria-pressed`.
- **Category tag (on card):** height 28, category bg, 20px Atrament icon circle, 14px bold.
- **Data status**, always icon + word:
  - *Potwierdzone* (confirmed): Atrament bg, white check icon and text (18.42:1).
  - *~ Szacunek* (estimate): 1.5px dashed Atrament border, mono `~`.
  - *Nieaktualne* (stale): 1.5px Kamień border, Kamień clock icon.
  - *Nowe* (new): Iskra bg, Atrament dot.
- **Keywords:** height 30, Mgła bg, 1px Krawędź border, 15px regular. Overflow shown as `+N`.

Category icons (16×16, stroke 1.6–1.8, round caps/joins):

| Category | Path |
|---|---|
| Uczelnie | `M2 6.5L8 3l6 3.5Z M4.5 8v4M8 8v4M11.5 8v4M2.5 13.5h11` |
| Patenty | `M4 2h5.5L12.5 5v9h-8.5Z M6.5 8h4M6.5 11h4` |
| Laboratoria | `M6 2h4M7 2v4.5L3.2 13a1 1 0 0 0 .9 1.5h7.8a1 1 0 0 0 .9-1.5L9 6.5V2 M5 10.5h6` |
| Startupy | `M2 12l4-4 3 2.5L14 4.5 M10 4.5h4v4` |

### Result cards

Order inside a card: category tag (+ `[PRZYKŁAD]` when it is example data), title (Lato Bold 22), who · where (Kamień), data status, mono source with date, then one primary action plus a "Zapisz" (save) toggle.
Card: white, 1px Krawędź border, radius 20, padding 20, gap 12. Hover border Kamień. Grid `minmax(300px, 1fr)`, gap 20. Title in Granat. Startup cards add a 48px Granat tile with Iskra initials.

### Navigation

- **Top bar:** min height 64, white, 1px Krawędź border, radius 16, with the 4 px regional band on top. Sygnet + wordmark (22px), then links, then search icon button and avatar.
- **Active item:** bold + 3px Głębia underline, never colour alone. Hover adds a Krawędź underline.
- **Tabs:** height 46, 3px Głębia underline when selected, mono count pill on Mgła 2.
- **Breadcrumb:** `/` separators in Kamień; current item bold with `aria-current="page"`.
- **Pagination:** 44 circles; current page Granat bg with white text; others white with Krawędź border; mono numbers.
- **Footer:** Granat surface, white text, Stal for secondary text, Iskra links and focus.

### Messages

Every message has an icon, a bold lead word and a colour. Tone: concrete and friendly. Padding 16, radius 16, 1.5px border.

| Kind | Lead word | Border / bg |
|---|---|---|
| Info | **Informacja.** | Głębia / Mgła |
| Success | **Gotowe.** | `#027641` / `#E6F2EC` |
| Warning | **Uwaga.** | Atrament / `#FFF6CC` |
| Error | **Błąd.** | `#B42318` / `#FBEDEB` |

- **Tooltip:** Granat bg, white text, radius 12, 15px, Iskra link, `role="tooltip"`.
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
3. Stick to the palette and the 60/20/15/5 proportions. The blue-to-green band is decoration only.
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
