# Requirements checklist: what the organisers need

> Research notes and the translated task files are kept outside this repository. Ask Delta if you need them.


Source documents: `task_files/en/01-task-description.md` (task), `02-competition-rules.md` (rules), `03-faq-clarification.md` (FAQ).
The FAQ is the most specific and governs where it differs from the mentor talk. Team decision on top of it: everyone signs in and selects a role, to deter IP misuse (the FAQ does not forbid this; it requires GDPR compliance). Requirement IDs F1 to F20 are used in `TASKS.md`.
Status tags: **Must**, **Should**. Written 2026-11-21.


## From the FAQ

| # | Requirement | Source section | How we cover it | Status in v3 |
|---|---|---|---|---|
| F1 | Automatic search, identification, analysis, assessment of **existing** innovations in Poland | 1, 8.1 | Collector pipeline over public sources | **Must** |
| F2 | Three areas: **technological, educational, administrative** | 2 | `area` field, filters, seed records in all three | **Must** |
| F3 | Innovation defined by **Oslo Manual 2018** | 2 | Definition screen, inclusion check ("new or improved", "differs significantly", "in use or available") | **Must** |
| F4 | Search by the needs of **six groups**: investors and firms, public bodies, universities, schools, startups and enterprises, individual inventors | 3 | Audience presets (saved filter sets and wording), not separate sites | **Must** |
| F5 | Use Polish and public sources (Google Scholar, universities, patent databases, NCBR, PARP, NCN, EU funds, CORDIS, firm and incubator sites, local-government and school sites, project reports) | 4 | Mix of API adapters and web crawling, see §5 | **Must** |
| F6 | Collect by **API, crawling, and AI analysis of documents** | 4 | All three, at least one example of each in the demo | **Must** |
| F7 | **Cyclic update** of the database, including status changes and currency | 4, 8.7 | Scheduled jobs, `last_checked` and `status_history`, "stale" flag | **Must** |
| F8 | Assess **implementation level**: concept, prototype, tests, pilot, used in practice | 5 | Five-step ladder | **Must** |
| F9 | **TRL 1 to 9** where applicable | 5 | TRL for technological items only. "Not applicable" for others | **Must** |
| F10 | **Innovativeness** (novelty and improvement vs existing solutions) | 5 | Similarity search against the catalogue and external records | **Must** |
| F11 | **Application potential** (other institutions, organisations, industries) | 5 | Transferability checks plus text from evidence | **Must** |
| F12 | **Credibility** (documentation, confirmation of implementation, reliable sources) | 5 | Count and quality of sources, confirmation flags | **Must** |
| F13 | **Innovation card**: description, area, source, status, readiness, potential | 5, 8.6 | The core UI object | **Must** |
| F14 | **Show sources. Separate confirmed facts from estimates** | 5 | Every field marked "confirmed (source)" or "estimate (how)". Model output is always an estimate | **Must** |
| F15 | **Search, filter and compare** innovations | 8.5 | Faceted search plus a side-by-side compare view | **Must** (compare is new) |
| F16 | Optional **anonymous** usage analytics | 7 | Aggregate counters only, no identifiers | **Should** |
| F17 | GDPR (RODO) for any personal data | 7 | Collect none by default. Public-source records may name people, so store only organisation-level facts and public contacts | **Must** |
| F18 | **Shorten time to find** an existing solution | 8.8 | Measure it in the demo: steps and seconds from query to card | **Must** (measure) |
| F19 | **Increase implemented innovations** based on **Polish IP** | 8.9 | Show reuse and transfer potential. Prioritise patents and Polish origin. Report as an expected effect | **Should** |
| F20 | "One place" to discover Polish innovations | closing | A single entry page and a unified card | **Must** |

| # | Requirement | How we cover it | Status |
|---|---|---|---|
| M1 | Sign-in is a drop-in for the national login: mObywatel, Profil Zaufany (with its SMS step), e-dowód, bank | One provider interface. Węzeł Krajowy (login.gov.pl) through SAML. Contract draft 3. `docs/api/AUTH-PROVIDERS.md` | **Must** (design now, real adapter after the hackathon) |
| M2 | Ukrainian. The same API call answers in the requested language, chosen on the server | `lang` and `Accept-Language`, one string per text, `uk` stored for every text | **Must** |
| M3 | Zoom, colour-blind safe, high and low contrast modes, navigation per WCAG 2.2 | Text-size and contrast controls, `prefers-contrast`, `forced-colors`, WCAG 2.2 new criteria | **Must** |
| M4 | Navigable with WAI-ARIA | Authoring Practices patterns, named landmarks, disclosure buttons | **Must** |
| M5 | PCI and Podkarpackie colour scheme | Proposal with measured contrast (§5) | **Should** |
| M6 | Clear visual hierarchy, better layout, proportional type like the PCI site | One fluid type scale, one primary action per screen (§6) | **Should** |
| M7 | Easy to use, above all | Three actions to the first card, usability test with three people | **Must** |
| M8 | Connect people with similar interests: keep similarity hits and research on the same card | `relatedWork` on the card with organisations and public contact pages. No messaging (FAQ §6) | **Must** |
| M9 | Harvest by API, crawl and other methods; owners configure sources in one file, tokens in `.env` | Source registry `data/sources/registry.json`, `tokenEnv`, admin readiness endpoint | **Should** |
| M10 | Frontend does visuals only; the backend does all processing | Audit done (§10). Language choice and labels move to the backend | **Must** |

## Explicit exclusions (FAQ §6). Do not build

- A platform for submitting new ideas
- A social network for innovators
- A crowdfunding platform
- A financing tool, or a search for investors

## From the task text (`01`) that still applies

- Detect, organise, assess, route and connect. "Connect" is now read as **pointing to the source and owner**, not as a matchmaking workflow (R).
- **Similar solutions and duplicate risk.** Same as F10.
- **At least two example use cases** (section 6).
- **Demo scenario a to e**, with "expected effectiveness measures" in step e.
- **Technical:** state data sources, assumptions and limits. Scale to many organisations. Security and data protection. Integration with existing systems. Transparent criteria. Room to grow after the hackathon.
- **Deliverables:** title, problem and solution text, how it works, **PDF at most 10 slides**, **video at most 3 minutes** in an open repository. Optional: code, demo link, screenshots.

## From the rules (`02`)

- Five jury criteria at 20% each: relevance and solution quality, idea and originality, usefulness and experience, prototype completeness and quality, implementation potential and scalability.
- Top three go to a **five-minute pitch**, judged on coherence, clarity, interest, ingenuity, charisma.
- **EUPL-1.2** release. No third-party elements that block it. No proprietary data, models, fonts or images.
- The prize is paid only after the full source and documentation are handed over.
- A minimum score of 2.5 of 5 is needed for any prize.

