# Lessons learned

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-009 |
| Wersja | 1.0 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

## Cel dokumentu

Zbiera doświadczenia z projektu według podejścia PMI do lessons learned: co zadziałało, co nie zadziałało, co zrobilibyśmy inaczej i jakie rekomendacje wynikają z tego dla kolejnych projektów. Każdy wpis opisuje konkretną sytuację z tego projektu i jej skutek.

## Co zadziałało

| Obszar | Sytuacja | Skutek |
|---|---|---|
| Dane | Pierwszego dnia sprawdziliśmy przez API dane.gov.pl, które zbiory naprawdę istnieją i jak są aktualne. | Wcześnie wyszło, że cen nie ma na dane.gov.pl. Drugie źródło (wykaz MZ) dołączyliśmy od razu, bez przebudowy projektu w połowie. |
| Dane | Całe czyszczenie i łączenie danych w SQL (DuckDB), raz, przy budowaniu bazy. | Nieuporządkowane CSV i XLSX przetwarzamy w ok. 4 s, a aplikacja wykonuje tylko proste odczyty (kilka milisekund). |
| Jakość | Próbki testowe wycięte z prawdziwych danych, a nie wymyślone. | Testy wyłapały przypadki, o których nie wiedzieliśmy: „mcg” i „µg”, dwa zapisy drogi podania, skreślone opakowania. |
| Produkt | Pokazywanie działającej wersji użytkownikowi po każdym większym kroku. | Użytkownik wskazał trzy problemy, których nie wykazałby żaden test: nieczytelny przycisk, mylące kwoty, „NaN zł”. |
| Wydajność | Skrypty pomiarowe (benchmark, Lighthouse) przed optymalizacją. | Wiedzieliśmy, co poprawiać (CSS biblioteki komponentów, brak kompresji), i mamy porównanie przed i po w liczbach. |
| Uruchomienie | Sprawdzenie `docker compose up` od zera, jak u osoby, która właśnie sklonowała repozytorium. | Instrukcja w README jest potwierdzona, a czasy w niej są zmierzone, nie szacowane. |
| Proces | Małe kroki, po każdym lint, typy i testy, potem CI na GitHubie. | Żaden błąd nie dotarł do repozytorium; CI było zielone od pierwszego pushu. |

## Co nie zadziałało

| Obszar | Sytuacja | Skutek | Jak naprawiliśmy |
|---|---|---|---|
| Produkt | Pokazywaliśmy dopłatę pacjenta (kwotę z refundacją). Użytkownik uznał 4,91 zł za opakowanie za błąd. | Najważniejszy ekran był niezrozumiały, mimo poprawnych danych. | Pokazujemy cenę urzędową opakowania, bez wyjaśnień o refundacji. |
| Interfejs | Dodaliśmy Nuxt UI „na zapas”, a używaliśmy z niego dwóch ikon. | 171 kB zbędnego CSS; przy ciemnym motywie systemu przycisk z biblioteki stał się nieczytelny. | Usunęliśmy bibliotekę, ikony są wbudowanymi SVG. |
| Bufor | Domyślnie bufor serwera wysyłał przeglądarce nagłówek „przechowuj dobę”. | Po zmianie danych przeglądarka pokazywała stare przykłady i „NaN zł”. | Bufor tylko po stronie serwera, przeglądarka zawsze pyta serwer (`no-cache`). |
| Narzędzia | Zainstalowaliśmy najnowszy TypeScript 7. | Linter (typescript-eslint) przestał działać. | Wróciliśmy do TypeScript 6. |
| System | Windows: plik bazy otwarty przez serwer jest zablokowany; git zamienia końce linii na CRLF. | Przebudowa danych wymagała zatrzymania serwera; parser opakowań nie działałby na klonie z Windows. | Instrukcja w CONTRIBUTING, `.gitattributes` i parser odporny na CRLF. |

## Co zrobilibyśmy inaczej

- **Ustalilibyśmy z użytkownikiem, jaką kwotę pokazujemy, zanim powstanie interfejs.** Szkic jednego ekranu z prawdziwymi liczbami wystarczyłby, żeby uniknąć trzech przeróbek.
- **Zaczęlibyśmy bez biblioteki komponentów** i dodawali ją dopiero, gdy rzeczywiście jest potrzebna.
- **Od początku zapisalibyśmy zasady bufora** (co buforuje serwer, a co przeglądarka) i sprawdzili nagłówki odpowiedzi.
- **Dodalibyśmy `.gitattributes` i skrypty pomiarowe w pierwszym commicie**, a nie po fakcie.
- **Sprawdzalibyśmy zgodność nowych głównych wersji narzędzi** przed instalacją (TypeScript 7).

## Rekomendacje

1. **Dla projektów na otwartych danych:** pierwszego dnia sprawdzić przez API, czy potrzebne dane istnieją, jak są aktualne i na jakiej licencji. Źródła spoza portalu przypinać do konkretnej wersji, żeby wynik był powtarzalny.
2. **Testować z prawdziwym użytkownikiem jak najwcześniej**, nawet z jedną osobą i na szkicu. Poprawne dane nie wystarczą, jeśli odbiorca nie rozumie, co widzi.
3. **Najpierw mierzyć, potem optymalizować.** Największe zyski dały zmiany, których bez pomiaru byśmy nie zauważyli.
4. **Każdą zależność traktować jako koszt** (rozmiar, błędy, aktualizacje), a nie jako darmową wygodę.
5. **Utrzymywać krótką pętlę jakości:** lint, typy i testy po każdej zmianie oraz CI przy każdym pushu.
6. **W tym projekcie dalej:** automatyczne odświeżanie danych, wykrywanie nowego obwieszczenia MZ, wykazy bezpłatnych leków (65+, DZ), zgłoszenie wydawcom rozbieżności w kodach GTIN.

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 1.0 | 2026-11-18 | krostia001 | Pierwsza wersja |
