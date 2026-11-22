# R1: Source list and rules check (draft 1)

Checked 2026-11-21 about 19:10 CET from this machine, with `curl` and web search. Scope for now: records published by institutions (ministries, offices, universities, agencies). No individual-person pages yet.

**What this draft is built from.** the team's source list and live checks made on 2026-11-22.

**How to read "Go".** Go means technically reachable today and no rule found that forbids our use. It does **not** mean a lawyer cleared the terms. Licence columns say "not found" where I did not find a statement. Every "Verified" below is something I ran. "Reported" is from a search result I did not open.

## Summary table

| # | Source | Method | Verified today | Key? | Rules found | Verdict |
|---|---|---|---|---|---|---|
| 1 | RAD-on open data (POL-on, projects, products) | API | **Yes**, anonymous JSON | No | Licence not found. Nightly refresh | **Go** |
| 2 | UPRP statistics API (`statystyka.pue.uprp.gov.pl`) | API | **Yes**, anonymous JSON | No | Aggregates only. Reuse terms not found | **Go** (aggregates) |
| 3 | UPRP e-Wyszukiwarka API (`api.uprp.gov.pl`) | API | Root is a login portal. Docs URL I tried returned 404 | e-Profil account | Account terms apply | **Hold**: needs an e-Profil |
| 4 | PTT, Platforma Transferu Technologii (`ptt.arp.pl`) | Crawl | **Yes**, 1,911 URLs in sitemap, 1,973 technologies shown | No | `robots.txt`: allow, `Crawl-delay: 5`, `/admin/` blocked. **Terms exist** (§2.3 database protection, §2.11 reuse needs consent), see §4 | **Go, limited** (link, short quotes, owner named, total cap) |
| 5 | PW repository (`repo.pw.edu.pl`) | API by request | Pages load | Yes, by email request | `robots.txt`: `Disallow: /` for all bots except Googlebot, `Crawl-delay: 50` | **No-go for crawling.** API only after approval |
| 6 | PPM (`ppm.edu.pl`) | Crawl | `index.seam` timed out from here. `robots.txt` read | Unknown | Same `Disallow: /` pattern, `Crawl-delay: 10` | **No-go for crawling** |
| 7 | PBN (`pbn.nauka.gov.pl`) | API | Swagger (V2.13, 79 paths) public. Calls return **403** without token | Yes, app token | Tokens issued only to institutions with an application-manager role | **No-go** for the hackathon |
| 8 | POL-on 2.0 REST API (`polon.nauka.gov.pl`) | API | Docs page loads | Yes, institutional | Designed for institutions to send data in | **No-go.** Use RAD-on instead (#1) |
| 9 | dane.gov.pl API | API | **Yes**, anonymous JSON | No | Per-dataset licence. NCBR dataset is 2021 only | **Go** (metadata and datasets) |
| 10 | GUS BDL API | API | **Yes**, anonymous JSON | Optional, for higher limits | Key goes in header `X-ClientId` | **Go** (regional numbers, R9) |
| 11 | OpenAlex | API | Anonymous request refused: shared daily budget used up | **Yes** (R10) | Data reported as CC0. Terms revised 2026-10-02 (reported) | **Go with a key** |
| 12 | CORDIS | Crawl or bulk | `robots.txt` read | No | Disallows `/search`, `/data/`, XML, PDF and RTF downloads | **No-go to crawl.** Check the official open-data download instead |

## Details per source

### 1. RAD-on open data: Go
- Base URL: `https://radon.nauka.gov.pl/opendata/`. The `/api/katalog-udostepniania-danych/...` pages are only the human catalogue (an Angular app that returns HTML for every path, even `robots.txt`).
- **Verified:** `GET /opendata/polon/institutions?resultNumbers=1` returns JSON (`results`, `pagination`, `version`) with REGON, NIP, address, `www`, e-mail and manager name.
- **Verified:** `POST /opendata/project/search` with body `{"resultNumbers":1}` returns research projects (Polish title, keywords, institutions, status). Swagger: `/opendata/integrated-data/metadata/project/swagger` (Project service 1.0.6). Product service 1.0.4 is at `.../metadata/product/swagger` (`POST /product/search`). Paging uses a `token` that is null on the first call. Max 100 results per call.
- The metadata service lists all entities: `/opendata/integrated-data/metadata`.
- **Personal data warning (F17):** project records include `personsInProject`, institution records include a manager's name and e-mail. Store organisation-level facts only. Do not copy person fields into cards.
- Reported, not verified: POL-on data refreshes once a night, non-public universities hourly.
- Licence: not found yet. Check the RAD-on terms page before the pitch. OPI-PIB's GitHub says the API data equals the public download site.

### 2. UPRP statistics API: Go for aggregates
- Listed on `uprp.gov.pl/pl/o-urzedzie/statystyki/api-do-statystyk`. Eleven endpoints of the form `https://statystyka.pue.uprp.gov.pl/team/uprp/<name>`: `zgl_kraj_zag`, `zgl_rodz_pod`, `zgl_woj`, `udziel_kraj_zag`, `udziel_rodz_pod`, `udziel_woj`, `wp_zgl_kraj_zag`, `wp_udz_kraj_zag`, `zt_zgl_kraj_zag`, `zt_udz_kraj_zag`.
- **Verified:** `zgl_woj` returns JSON by voivodeship and year from 2010 (inventions and utility models filed). This is a ready source for the **Polish-IP view** and regional context. It gives counts, not individual patents.
- The statistics page says individual records come from e-Wyszukiwarka, and bulk record sets need a written request under the public-information act. Allowed fields: number, date, title, applicant name and city, classification.
- The earlier note that UPRP is "unreliable today" was true of the main site. This API answered fine today.

### 3. UPRP e-Wyszukiwarka API: Hold
- `https://api.uprp.gov.pl/` shows a login page ("PUE UP API Zewnętrzne"). Reported: any e-Profil user can call `/api/external/pwp/<application number>`, JSON, with authorisation. Public PDF manual: `api.uprp.gov.pl/assets/instrukcje/PROD/e-Wyszukiwarka.pdf` (I did not open it).
- It looks up by number, so it cannot discover patents. Useful only to enrich a card whose number we already know. Needs a team member's e-Profil.

### 4. PTT (ARP): Go, limited (updated 2026-11-22, issue #10)
- The nearest thing to ready-made innovation cards: "Baza technologii" (1,973 listings shown on the home page), "Baza poszukujących technologii", "Baza ekspertów", plus a hydrogen section. Listings carry a protection form (invention, application, know-how, utility model, copyright).
- Sitemap: `http://ptt.arp.pl/sitemap.xml`, 1,911 URLs. Pattern `/bazy/<slug>/`. `robots.txt` allows everything except `/admin/`, with `Crawl-delay: 5`. At 5 s per page, 60 listings take 5 minutes. Fine for the seed set.
- Listings are posted by users (companies, universities, patent attorneys), so text belongs to them. Use short quotes with a link and name the owner.
- **Terms of use exist** (found by Karrie, #10): the footer of every listing links `https://ptt.arp.pl/media/terms_and_conditions/Regulamin_4dWgds8.pdf` (8 pages, operator ARP S.A.).
  - §2.3: the data is protected under the database act (ustawa z 27 lipca 2001 r. o ochronie baz danych) and the copyright act.
  - §2.6: unregistered people may browse and accept the terms by doing so.
  - §2.11: „Wykorzystywanie jakichkolwiek materiałów zamieszczonych na PTT bez uprzedniej zgody (lub innego porozumienia) podmiotu uprawnionego może stanowić naruszenie praw…”
- **What we do because of it** (not legal advice): we link to each listing, quote it briefly, name the owner, add our own assessment, and never copy a substantial part of the database. The collector stops at a total of `ptt.max_cards_total` PTT cards (30 in `data/sources/targets.json`), besides the per-run limits. Pitch wording: "we link to PTT listings and quote them briefly", not "we crawl PTT".
- **Still open (R7/R11):** ask the mentors or ARP whether linking with short quotes plus our own assessment is acceptable for a public prototype.
- Operator is ARP (ARP page says so). A PFR page also lists it, so say "ARP" in the pitch.
- Not tested: field structure of a full listing (the page I read was mostly navigation and a glossary). Check one real listing in a browser (R6).

### 5 and 6. PW repository and PPM: No-go for crawling
- Both run the same repository software. `robots.txt` is `User-agent: *` `Disallow: /` and allows only Googlebot. Crawling it would break robots rules.
- The site states an API exists. Per Karrie's note, documentation and a key come after an email to `api@omegapsir.io` with personal data and a justification. **I did not send that email.** It shares personal information with a third party, so Delta must decide who writes it and what to say.
- Karrie's three PW links (publications, research data, PhD theses of one unit) are good for a manual look. Hand-pick records for seed cards and cite the page.

### 7 and 8. PBN and POL-on 2.0 REST: No-go
- PBN: Swagger loads (V2.13), every call without `X-App-Id` and `X-App-Token` gives 403. Tokens go to registered institutions. Production access also needs a test-environment integration first. Not possible in 24 hours.
- POL-on 2.0 REST API is for institutions to submit data. Public reads are covered by RAD-on (#1).

### 9. dane.gov.pl: Go
- `https://api.dane.gov.pl/1.4/` returns JSON:API. **Verified:** dataset 2785, "Projekty dofinansowane przez NCBR ze środków krajowych", **2021 only**, last changed 2022. Good for one backfilled example, not for freshness. I found no NCN dataset.

### 10. GUS BDL: Go
- `https://bdl.stat.gov.pl/api/v1/` answered anonymously (`/subjects`, 33 records). Official page says anonymous use has lower limits and a free key (header `X-ClientId`) raises them. Use for R9.

### 11. OpenAlex: Go with a key
- Anonymous call refused today: the shared per-IP daily budget was spent. So R10 (free key) is now urgent. Reported: data is CC0, and a bulk snapshot is free.

### 12. CORDIS: No-go to crawl
- `robots.txt` blocks `/search`, `/data/` and file downloads. Use the official open-data downloads (not checked) instead of crawling.

## Other candidates, not yet checked
Not verified by me, only seen in search results:
- University transfer-office databases: University of Warsaw (`oferta.uw.edu.pl`, UOTT), University of Gdańsk (CTT), Wrocław UST (WCTT). Check `robots.txt` and terms per site first.
- PACTT national catalogue. One secondary source mentions it. Unconfirmed.
- EPO Espacenet OPS and Lens.org for patents. Terms and keys not checked.
- EU Funding and Tenders and data.europa.eu. Not re-checked today.
- NCN funded-project data. Nothing found.

## What this changes in the plan
1. **Backend (B6a):** the first API adapter can be **RAD-on** (no key, works now), not only OpenAlex. Add UPRP statistics for the Polish-IP view. GUS BDL for regional numbers.
2. **Crawler (B6b):** use **PTT** as the first crawl target. Respect `Crawl-delay: 5`.
3. **PW and PPM:** seed by hand from the pages Karrie found. No crawler.
4. The earlier plan said UPRP, RSPO, KRS are unreliable. UPRP statistics work today. RSPO and KRS were not retested.

## Needs a human decision
1. Who e-mails `api@omegapsir.io`, with whose personal data. Not worth it unless the team wants PW data beyond hand-picked records.
2. Who asks ARP about PTT terms.
3. Who registers the OpenAlex key (R10).
4. Where the earlier research lives, so I can merge it.
