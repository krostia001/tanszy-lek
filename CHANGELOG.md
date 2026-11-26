# Historia zmian

Wszystkie istotne zmiany w projekcie są opisane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.1.0/), a projekt stosuje [wersjonowanie semantyczne](https://semver.org/lang/pl/).

## [Unreleased]

## [1.1.0] - 2026-11-26

Porównanie ceny za tabletkę: serwis znajduje tańszą opcję także w opakowaniu innej wielkości, np. 90 tabletek zamiast 30. Do tego udostępnianie linku do leku.

### Dodano

- Cena za tabletkę (lub kapsułkę) przy cenie opakowania.
- Sekcja „Taniej za tabletkę w innym opakowaniu” na stronie leku: odpowiedniki i ten sam lek w innej wielkości opakowania, posortowane od najniższej ceny za tabletkę, z przeliczeniem na liczbę tabletek w wybranym opakowaniu. Dzięki temu tańszą opcję ma 2 364 z 3 649 opakowań z ceną (65%), wcześniej 1 827 (50%). Syropy, zastrzyki, inhalatory i opakowania z różnymi dawkami pomijamy, bo cena za sztukę nic o nich nie mówi.
- Przycisk „Udostępnij” na stronie leku: na telefonie otwiera systemowe udostępnianie, na komputerze kopiuje link.
- Wybrane opakowanie jest zapisane w adresie strony (`?opakowanie=GTIN`), więc udostępniony link otwiera to samo opakowanie.
- 15 testów: liczenie tabletek w opakowaniu na prawdziwych zapisach z rejestru i polskie formy słów (48 testów razem).

## [1.0.0] - 2026-11-18

Pierwsze publiczne wydanie: wyszukiwarka tańszych odpowiedników leków z cenami, uruchamiana jedną komendą (`docker compose up`), z pełną dokumentacją projektu.

### Dodano

- Ceny urzędowe opakowań z wykazu leków refundowanych Ministerstwa Zdrowia, połączone z rejestrem po kodzie GTIN.
- Model danych: leki dla ludzi z ważnym pozwoleniem, opakowania (bez skreślonych), ceny, grupy odpowiedników (substancja, dawka, postać, droga podania) i indeks wyszukiwania.
- API: wyszukiwanie z tolerancją literówek (`/api/szukaj`), lek z odpowiednikami (`/api/lek/[slug]`), przykłady oszczędności (`/api/przyklady`), źródła danych (`/api/zrodla`).
- Strony: główna z wyszukiwarką i przykładami, strona leku, wyniki wyszukiwania, „O projekcie” w formie ulotki, strona błędu 404.
- Projekt graficzny „Szyld apteki”: paleta zieleni aptecznej, fonty Barlow, dostępność dla starszych osób (większy tekst, kontrast, obsługa klawiaturą).
- Skrypt `scripts/make-fixtures.ts` i 33 testy na próbkach prawdziwych danych.
- Pomiary wydajności: `bun run bench` (czas odpowiedzi, p50/p95) i `bun run lighthouse` (Lighthouse, profil mobilny). Wyniki przed i po optymalizacji w `docs/wydajnosc.md`.
- `robots.txt`.
- Dokumentacja: opis danych i ich jakości, architektura, raport końcowy (szkielet ISO 21513), lessons learned (PMI); metryka i historia zmian wg ISO 10013 we wszystkich dokumentach.

### Zmieniono

- Serwis pokazuje cenę urzędową opakowania zamiast dopłaty pacjenta, bez rozbicia na refundację NFZ, i porównuje odpowiedniki po tej cenie (także przykłady na stronie głównej). Nad listą odpowiedników zdanie, o ile taniej jest najtańszy.
- Usunięto Nuxt UI: używaliśmy tylko dwóch ikon, a biblioteka dodawała 171 kB CSS i ok. 200 kB JavaScriptu. Ikony są wbudowanymi plikami SVG.
- Kompresja HTML i JSON (brotli/gzip) oraz statycznych plików przy buildzie. Strona waży ok. 220 KiB zamiast 750 KiB, Lighthouse 100 we wszystkich kategoriach.
- Tylko używane grubości fontów; font nagłówka ładowany z wyprzedzeniem.
- Biały tekst na zielonym nagłówku (wcześniej kontrast 4,36:1 i 3,87:1, poniżej normy WCAG AA).
- Obraz Dockera 623 MB zamiast 1,01 GB: jedna kopia DuckDB i `COPY --chown` zamiast `chown -R`.
- Pamięć podręczna API w trybie deweloperskim trzymana w pamięci, więc po `bun run data` restart serwera zawsze pokazuje świeże dane.
- Serwis ma tylko jasny motyw.
- Lint: ESLint z modułu `@nuxt/eslint` zamiast Biome (lepsza obsługa plików `.vue`). TypeScript 6, bo TypeScript 7 nie działa jeszcze z typescript-eslint.

### Naprawiono

- Przeglądarka nie przechowuje już odpowiedzi API przez dobę (`cache-control: no-cache`). Wcześniej po aktualizacji danych strona główna mogła pokazać stare dane, a ceny jako „NaN zł”. Wyniki zapytań są nadal buforowane po stronie serwera (`defineCachedFunction`).
- Brakująca cena wyświetla się jako „—”, nigdy jako „NaN zł”.
- Parser opakowań działa także z końcami linii CRLF (Windows).

## 0.1.0 - 2026-11-17 (wersja robocza, bez wydania)

### Dodano

- Szkielet projektu: Nuxt 4 (kod w `src/`), Tailwind CSS 4, DuckDB.
- Pobieranie Rejestru Produktów Leczniczych przez API dane.gov.pl (`scripts/fetch-data.ts`).
- Budowanie bazy DuckDB z pobranych danych (`scripts/build-db.ts`).
- Endpoint `GET /api/health` z liczbą produktów i datą danych.
- Testy (Vitest) na próbce danych w `tests/fixtures/`.
- ESLint, sprawdzanie typów i CI w GitHub Actions.
- Uruchamianie jedną komendą: `docker compose up`.
- Pliki open source: README, LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, szablony zgłoszeń i PR.

## Metryka dokumentu

| Identyfikator | Wersja | Status | Autor | Data |
|---|---|---|---|---|
| TL-DOC-004 | 1.3 | zatwierdzony | krostia001 | 2026-11-26 |

Ten dokument sam jest historią zmian projektu; każda wersja projektu dopisuje w nim nową sekcję.

[Unreleased]: ../../compare/v1.1.0...HEAD
[1.1.0]: ../../releases/tag/v1.1.0
[1.0.0]: ../../releases/tag/v1.0.0
