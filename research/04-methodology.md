# R8: How Pomysłownik! assesses an innovation / Jak Pomysłownik! ocenia innowację

Plain-language methodology for the methodology page (task R8, requirements F8–F14). It describes what the app computes today (`backend/app/services/scoring.py`, version v1), checked against real cards. The weights are **indicative** until the mentors answer R7 question 1.

---

## English

### The short version

Every card answers five questions about an innovation:

1. **How far has it got?** (implementation level)
2. **How mature is the technology?** (TRL, technical items only)
3. **How new is it?** (innovativeness)
4. **Could others use it?** (application potential)
5. **Can we trust what the card says?** (credibility)

Two rules apply to all five:

- **Facts and estimates are kept apart.** A value is **confirmed** only when a source states it, and we show the quoted sentence. Anything we work out ourselves is an **estimate**, and the card says how we got it.
- **The AI never makes up a number.** AI helps read the sources, but every score is calculated by a fixed formula from stored evidence: counts, dates and numbers quoted from sources. The same data always gives the same score. If there is too little data, the card says **„not enough data”** instead of guessing.

### Before the five questions: is it an innovation at all?

We use the international definition of innovation (the OECD/Eurostat Oslo Manual). A solution counts as an innovation only if all three answers are yes:

- Is it **new or improved**?
- Does it **differ significantly** from what was there before?
- Is it **available or in use**? A plan or a lab result alone is not enough.

A card that fails stays in the database, because it may become an innovation later. The card shows which condition failed.

### 1. Implementation level: how far has it got?

A five-step ladder: **concept → prototype → testing → pilot → in practice**.

- *Concept*: an idea or plan, nothing built yet.
- *Prototype*: a working sample exists.
- *Testing*: it is being tested, in the lab or in the field.
- *Pilot*: it runs for real, but in a limited place or for a limited time.
- *In practice*: it is in regular use.

The level is **confirmed** when a source says so, for example "the service is running" or "the pilot ran in 20 schools". Otherwise it is an **estimate**, with the reason.

### 2. TRL: how mature is the technology? (technical items only)

The Technology Readiness Level is the EU's 1-to-9 scale: from TRL 1 (basic principle observed), through TRL 4 (validated in the lab) and TRL 6–7 (prototype shown in real conditions), to TRL 9 (proven in operation). It is used only for technological items. For schools and offices the card says **„not applicable”**. When the source gives a TRL, it is confirmed; when it does not, we estimate it and say why.

### 3. Innovativeness: how new is it? (0–100)

The more a solution differs from what already exists, the higher the score. We measure two things:

- **Distance to similar solutions in our database.** We find the three most similar cards. If they are on average 29% similar, the distance part is 100 − 29 = 71. This needs at least 5 other cards to compare with.
- **How crowded the field is in Polish research** (when we have the data). We count similar publications by Polish institutions in OpenAlex, an open research database. No publications gives 100; 1,000 or more gives 0 (log scale).

When both are known, the score is **60% distance + 40% rarity**.

*Example (reservoir desilting card):* the three closest cards are on average 29% similar, so the distance is 71. OpenAlex finds 0 similar works, so the rarity is 100. The score is 0.6 × 71 + 0.4 × 100 = 82.6, rounded to **83**.

### 4. Application potential: could others use it? (0–100)

The more ready, documented and transferable a solution is, the higher the score:

| Part | Points | In plain words |
|---|---|---|
| Implementation level | up to 40 | the further it has got, the easier it is to adopt (concept 8 … in practice 40) |
| Documentation | up to 30 | sources (up to 15), a contact to the owner (10), quoted passages (5) |
| Other sectors named | up to 20 | other industries or institutions that could use it |
| Numbers stated by a source | 10 | real figures, not only descriptions |

*Example (rotomolding card):* prototype 16 + one source 7.5 + owner contact 10 + quote 5 + three sectors 20 + numbers 10 = 68.5, which the app rounds to **68**.

### 5. Credibility: can we trust what the card says? (0–100)

The better the evidence, the higher the score:

| Part | Points | In plain words |
|---|---|---|
| Independent sources | up to 35 | three or more sources give full points |
| An institutional source | 25 | a ministry, university or city site (.gov.pl, .edu.pl, city domains) |
| Implementation confirmed by a source | 20 | a source says it is really used or tested |
| Every source quoted | 10 | each source has a quoted sentence |
| Checked recently | 10 | within 30 days (5 points within 180 days) |

*Example (rotomolding card):* one source 11.7 + institutional 25 + implementation confirmed 20 + quoted 10 + checked today 10 = 76.7, rounded to **77**.

### Confidence and „not enough data”

Each score also has a **confidence** level (low, medium or high), based on how much data it rests on. Credibility and application potential are high with three or more sources. Innovativeness depends on how many cards we could compare with. With no sources, or fewer than 5 cards to compare, the card shows **„not enough data”**, never a made-up number.

### Known limits and planned fixes

These come from our own review of the cards (R5; issues #12 and #22):

- **"Confirmed" from one word.** The collector confirmed "prototype" because a source said „wykonano” ("was made"). That one word added 20 credibility points to the rotomolding card. Fix: confirm a level only from words that clearly name it.
- **Guessed sectors raise the score.** "Could also be used in" sectors written by the AI earn up to 20 points of application potential. Fix: count only sectors named by the source; label the rest as estimates.
- **A zero can be a search artefact.** An unusual OpenAlex search can find 0 publications, which pushes innovativeness up. Fix: show the search used and check zeros by hand.
- **Old projects look fresh.** "Checked recently" measures our last check, not the age of the project. Fix: also use the source's own date (for example the project end date).
- **Platforms are not institutions.** A university's listing on a technology platform counts as non-institutional, because the offering party writes it. That is intended, but it lowers such cards. The card explains it.
- **The weights are ours.** They are indicative until the mentors confirm or change them (R7).

---

## Polski

### W skrócie

Każda karta odpowiada na pięć pytań o innowację:

1. **Na jakim jest etapie?** (poziom wdrożenia)
2. **Jak dojrzała jest technologia?** (TRL, tylko rozwiązania technologiczne)
3. **Na ile jest nowa?** (innowacyjność)
4. **Czy inni mogą z niej skorzystać?** (potencjał zastosowania)
5. **Czy można ufać temu, co mówi karta?** (wiarygodność)

Dwie zasady obowiązują przy wszystkich pięciu:

- **Fakty są oddzielone od szacunków.** Wartość jest **potwierdzona** tylko wtedy, gdy podaje ją źródło, i pokazujemy cytat. Wszystko, co wyliczamy sami, to **szacunek**, a karta mówi, jak go uzyskaliśmy.
- **AI nigdy nie wymyśla liczb.** Model pomaga czytać źródła, ale każdy wynik liczy stały wzór z zapisanych dowodów: liczb, dat i cytatów ze źródeł. Te same dane zawsze dają ten sam wynik. Gdy danych jest za mało, karta mówi **„za mało danych”** zamiast zgadywać.

### Zanim padną pytania: czy to w ogóle innowacja?

Stosujemy międzynarodową definicję innowacji (Podręcznik Oslo, OECD/Eurostat). Rozwiązanie jest innowacją tylko wtedy, gdy na wszystkie trzy pytania odpowiedź brzmi „tak”:

- Czy jest **nowe lub ulepszone**?
- Czy **znacząco różni się** od tego, co było wcześniej?
- Czy jest **dostępne lub stosowane**? Sam plan albo wynik laboratoryjny nie wystarczy.

Karta, która nie spełnia warunków, zostaje w bazie, bo rozwiązanie może jeszcze stać się innowacją. Karta pokazuje, którego warunku brakuje.

### 1. Poziom wdrożenia: na jakim jest etapie?

Pięć stopni: **koncepcja → prototyp → testowanie → pilotaż → wdrożone w praktyce**.

- *Koncepcja*: pomysł lub plan, nic jeszcze nie zbudowano.
- *Prototyp*: istnieje działający egzemplarz.
- *Testowanie*: trwają testy w laboratorium lub w terenie.
- *Pilotaż*: działa naprawdę, ale w ograniczonym miejscu lub czasie.
- *Wdrożone w praktyce*: jest w stałym użyciu.

Poziom jest **potwierdzony**, gdy mówi o nim źródło, na przykład „usługa działa” albo „pilotaż objął 20 szkół”. W innym wypadku to **szacunek** z podanym uzasadnieniem.

### 2. TRL: jak dojrzała jest technologia? (tylko rozwiązania technologiczne)

Poziom gotowości technologicznej to unijna skala od 1 do 9: od TRL 1 (zaobserwowano podstawową zasadę), przez TRL 4 (walidacja w laboratorium) i TRL 6–7 (prototyp pokazany w warunkach rzeczywistych), do TRL 9 (sprawdzone w działaniu). Stosujemy ją tylko do technologii. Dla szkół i urzędów karta mówi **„nie dotyczy”**. TRL podany przez źródło jest potwierdzony; jeśli źródło go nie podaje, szacujemy go i mówimy dlaczego.

### 3. Innowacyjność: na ile jest nowa? (0–100)

Im bardziej rozwiązanie różni się od istniejących, tym wyższy wynik. Mierzymy dwie rzeczy:

- **Odległość od podobnych rozwiązań w naszej bazie.** Szukamy trzech najbardziej podobnych kart. Jeśli są średnio podobne w 29%, część „odległość” wynosi 100 − 29 = 71. Potrzeba co najmniej 5 innych kart do porównania.
- **Jak „zatłoczona” jest dziedzina w polskiej nauce** (gdy mamy dane). Liczymy podobne publikacje polskich instytucji w otwartej bazie OpenAlex. Zero publikacji daje 100, a 1000 lub więcej daje 0 (skala logarytmiczna).

Gdy znamy obie wartości, wynik to **60% odległości + 40% rzadkości**.

*Przykład (karta „Ciągłe odmulanie zbiorników”):* trzy najbliższe karty są podobne średnio w 29%, więc odległość wynosi 71. OpenAlex nie znajduje podobnych prac, więc rzadkość wynosi 100. Wynik to 0,6 × 71 + 0,4 × 100 = 82,6, po zaokrągleniu **83**.

### 4. Potencjał zastosowania: czy inni mogą z niej skorzystać? (0–100)

Im rozwiązanie jest dojrzalsze, lepiej opisane i łatwiejsze do przeniesienia, tym wyższy wynik:

| Składnik | Punkty | Po ludzku |
|---|---|---|
| Poziom wdrożenia | do 40 | im dalej, tym łatwiej przejąć (koncepcja 8 … praktyka 40) |
| Dokumentacja | do 30 | źródła (do 15), kontakt do właściciela (10), cytaty (5) |
| Wskazane inne sektory | do 20 | inne branże lub instytucje, które mogłyby z niego skorzystać |
| Liczby podane przez źródło | 10 | konkretne dane, nie tylko opis |

*Przykład (karta „Odlewanie rotacyjne”):* prototyp 16 + jedno źródło 7,5 + kontakt 10 + cytat 5 + trzy sektory 20 + liczby 10 = 68,5, co aplikacja zaokrągla do **68**.

### 5. Wiarygodność: czy można ufać karcie? (0–100)

Im lepsze dowody, tym wyższy wynik:

| Składnik | Punkty | Po ludzku |
|---|---|---|
| Niezależne źródła | do 35 | trzy lub więcej źródeł dają komplet punktów |
| Źródło instytucjonalne | 25 | strona ministerstwa, uczelni lub miasta (.gov.pl, .edu.pl, domeny miast) |
| Wdrożenie potwierdzone przez źródło | 20 | źródło mówi, że rozwiązanie naprawdę działa lub jest testowane |
| Każde źródło z cytatem | 10 | przy każdym źródle jest cytat |
| Niedawno sprawdzone | 10 | w ciągu 30 dni (5 punktów w ciągu 180 dni) |

*Przykład (karta „Odlewanie rotacyjne”):* jedno źródło 11,7 + źródło instytucjonalne 25 + potwierdzone wdrożenie 20 + cytat 10 + sprawdzone dziś 10 = 76,7, po zaokrągleniu **77**.

### Pewność wyniku i „za mało danych”

Każdy wynik ma też **pewność** (niska, średnia, wysoka), zależną od ilości danych. Wiarygodność i potencjał zastosowania mają wysoką pewność przy trzech lub więcej źródłach. Innowacyjność zależy od liczby kart, z którymi mogliśmy porównać. Bez źródeł albo przy mniej niż 5 kartach do porównania karta pokazuje **„za mało danych”**, nigdy wymyśloną liczbę.

### Znane ograniczenia i planowane poprawki

Wynikają z naszego przeglądu kart (R5; zgłoszenia #12 i #22):

- **„Potwierdzone” na podstawie jednego słowa.** Kolektor potwierdził „prototyp”, bo źródło napisało „wykonano”. To jedno słowo dodało karcie „Odlewanie rotacyjne” 20 punktów wiarygodności. Poprawka: potwierdzać poziom tylko słowami, które go jasno nazywają.
- **Zgadywane sektory podnoszą wynik.** Sektory w polu „może być użyte także w”, dopisane przez AI, dają do 20 punktów potencjału zastosowania. Poprawka: liczyć tylko sektory podane przez źródło, a resztę oznaczać jako szacunek.
- **Zero może wynikać z wyszukiwania.** Nietypowe zapytanie do OpenAlex może nie znaleźć żadnych publikacji, co podnosi innowacyjność. Poprawka: pokazywać użyte zapytanie i sprawdzać zera ręcznie.
- **Stare projekty wyglądają na świeże.** „Niedawno sprawdzone” mierzy nasze ostatnie sprawdzenie, a nie wiek projektu. Poprawka: uwzględniać też datę ze źródła (np. datę zakończenia projektu).
- **Platforma to nie instytucja.** Ogłoszenie uczelni na platformie transferu technologii liczymy jako źródło nieinstytucjonalne, bo pisze je oferent. Tak ma być, ale obniża to wynik takich kart. Karta to wyjaśnia.
- **Wagi są nasze.** Pozostają orientacyjne, dopóki mentorzy ich nie potwierdzą lub nie zmienią (R7).
