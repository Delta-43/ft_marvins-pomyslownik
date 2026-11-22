# Team progress

Each person has one file in this folder. Update your own file as you work. Edit **only your own file**, so we never get merge conflicts.

| Person | File |
|---|---|
| Delta | `delta.md` |
| Karrie | `karrie.md` |
| Przemek | `przemek.md` |
| Philip | `philip.md` |
| Alban | `alban.md` |
| Andrei | `andrei.md` |

## How to update

1. Pull the latest `main`. To take a task, add its ID to **My tasks** in your file (see the index below).
2. Change the status marker of your tasks: `[ ]` to do, `[~]` in progress, `[x]` done, `[!]` blocked.
3. Keep **Doing now** to one line. Add a line to **Blockers** the moment you are stuck, and say who can help.
4. Add a short entry to the **Log** with the time.
5. Commit with a message like `team: przemek F1 done` and push. Small, frequent commits are fine.

## See the overall status

```bash
python3 team/status.py
```

It counts the markers in every file and lists all blockers.

## Rules of thumb

- If a task changes the API, change `docs/api/openapi.yaml` first (see `TASKS.md`, working rules).
- If you take a task from someone else, tell them, and move it to your file.
- Never put secrets (keys, tokens, passwords) in these files or anywhere in the repository.

> The `team/` folder, `PLAN.md` and `TASKS.md` stay until the final step. They are removed just before the 10:30 submission.

## Task index

| ID | Task | Track |
|---|---|---|
| P1 | Compose files, env example, mock profile | Platform and containers |
| P2 | Backend Dockerfile (multi-stage, non-root, healthcheck that matches the base ima | Platform and containers |
| P3 | Frontend Dockerfile (Next.js standalone build, build arg for the API URL) | Platform and containers |
| P4 | Staging | Platform and containers |
| P5 | Deploy to delta-server and tunnel | Platform and containers |
| P6 | Smoke test script | Platform and containers |
| P7 | CI | Platform and containers |
| P8 | Repository hygiene | Platform and containers |
| P9 | Reproducible data | Platform and containers |
| B1 | API skeleton | Backend |
| B2 | Database schema and migrations | Backend |
| B3 | Seed loader and read endpoints (behind sign-in once B12 exists; until then accep | Backend |
| B4 | Search | Backend |
| B5 | Scoring engine and validator | Backend |
| B6a | Collector | Backend |
| B6b | Collector | Backend |
| B6c | Collector | Backend |
| B6d | Oslo inclusion check | Backend |
| B7 | Refresh job and runs | Backend |
| B8 | Events and usage stats | Backend |
| B9 | Admin token and `Idempotency-Key` handling | Backend |
| B10 | Embeddings similarity (optional) | Backend |
| B11 | Contract test against the running API (schemathesis or similar) | Backend |
| B12 | Sign-in | Backend |
| R1 | Source list and rules check. For each source we plan to use | Research and verification |
| R2 | Seed set, first 10 cards (3 technological, 4 educational, 3 administrative) in t | Research and verification |
| R3 | Two deep use cases chosen and fully documented | Research and verification |
| R4 | Seed set, grow to 40 to 60 cards across the three areas | Research and verification |
| R5 | Verify. A second look at every "confirmed" field | Research and verification |
| R6 | Read the PFR Technology Transfer Platform in a browser and write 10 lines | Research and verification |
| R7 | Ask the mentors | Research and verification |
| R8 | Methodology text (plain Polish and English) | Research and verification |
| R9 | Regional context numbers | Research and verification |
| R10 | Register the OpenAlex key (free) and hand it to the backend developer through a  | Research and verification |
| F0 | Scaffold | Frontend |
| F1 | Home | Frontend |
| F2 | Results | Frontend |
| F3 | Card page | Frontend |
| F4 | Compare | Frontend |
| F5 | Insights page | Frontend |
| F6 | Admin demo page | Frontend |
| F7 | Pages | Frontend |
| F8 | Usage events | Frontend |
| F9 | Accessibility pass | Frontend |
| F10 | Polish copy and translation check of every screen | Frontend |
| F11 | Sign-in and registration | Frontend |
| Q1 | End-to-end test of the demo path (Playwright) | QA, slides, video |
| Q2 | Demo script (timed) and rehearsal | QA, slides, video |
| Q3 | Effectiveness numbers for the pitch | QA, slides, video |
| S1 | Slides, at most 10, PDF | QA, slides, video |
| S2 | Video, at most 3 minutes, uploaded to an open repository, link in the submission | QA, slides, video |
| S3 | Submission text | QA, slides, video |
| S4 | Pitch (5 minutes) for stage II | QA, slides, video |
| S5 | Final repository check | QA, slides, video |
| C3 | Contract draft 3: review and merge | Mentor feedback |
| C4 | Contract draft 4: review and merge | Mentor feedback |
| B13 | Provider interface and redirect sign-in flow | Mentor feedback |
| B14 | Węzeł Krajowy (login.gov.pl) adapter (after the hackathon) | Mentor feedback |
| B19 | Known gaps G1 to G9 (after the hackathon) | Mentor feedback |
| B15 | Server-side language (pl, en, uk) | Mentor feedback |
| B16 | Source registry and admin source config | Mentor feedback |
| B17 | Related work stored on the card | Mentor feedback |
| B18 | Backend owns all labels | Mentor feedback |
| F12 | Sign-in page for real providers | Mentor feedback |
| F13 | Frontend in three languages, Cyrillic fonts | Mentor feedback |
| F14 | Display settings: text size, contrast modes | Mentor feedback |
| F15 | WCAG 2.2 fixes | Mentor feedback |
| F16 | ARIA pass | Mentor feedback |
| F17 | Apply the PCI palette | Mentor feedback |
| F18 | Apply the type scale and layout | Mentor feedback |
| F19 | Ease of use: three actions to the first card | Mentor feedback |
| F20 | Card section "Who else works on this" | Mentor feedback |
| D1 | PCI and Podkarpackie palette | Mentor feedback |
| D2 | Type scale and layout | Mentor feedback |
| R11 | Ask the mentor: FAQ §6 and login.gov.pl applications | Mentor feedback |
| R12 | Review the Ukrainian texts | Mentor feedback |
| P10 | Document the registry and new variables | Mentor feedback |
| Q4 | Usability test with three people | Mentor feedback |
