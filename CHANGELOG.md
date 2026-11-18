# Historia zmian

Wszystkie istotne zmiany w projekcie są opisane w tym pliku.

Format oparty na [Keep a Changelog](https://keepachangelog.com/pl/1.1.0/), a projekt stosuje [wersjonowanie semantyczne](https://semver.org/lang/pl/).

## [Unreleased]

### Dodano

- Ceny urzędowe opakowań z wykazu leków refundowanych Ministerstwa Zdrowia, połączone z rejestrem po kodzie GTIN.
- Model danych: leki dla ludzi z ważnym pozwoleniem, opakowania (bez skreślonych), ceny, grupy odpowiedników (substancja, dawka, postać, droga podania) i indeks wyszukiwania.
- API: wyszukiwanie z tolerancją literówek (`/api/szukaj`), lek z odpowiednikami (`/api/lek/[slug]`), przykłady oszczędności (`/api/przyklady`), źródła danych (`/api/zrodla`).
- Strony: główna z wyszukiwarką i przykładami, strona leku, wyniki wyszukiwania, „O projekcie” w formie ulotki, strona błędu 404.
- Projekt graficzny „Szyld apteki”: Nuxt UI, paleta zieleni aptecznej, fonty Barlow, dostępność dla starszych osób (większy tekst, kontrast, obsługa klawiaturą).
- Skrypt `scripts/make-fixtures.ts` i 33 testy na próbkach prawdziwych danych.

### Zmieniono

- Serwis pokazuje cenę urzędową opakowania zamiast dopłaty pacjenta, bez rozbicia na refundację NFZ, i porównuje odpowiedniki po tej cenie (także przykłady na stronie głównej). Nad listą odpowiedników zdanie, o ile taniej jest najtańszy.
- Pamięć podręczna API w trybie deweloperskim trzymana w pamięci, więc po `bun run data` restart serwera zawsze pokazuje świeże dane.

### Naprawiono

- Przeglądarka nie przechowuje już odpowiedzi API przez dobę (`cache-control: no-cache`). Wcześniej po aktualizacji danych strona główna mogła pokazać stare dane, a ceny jako „NaN zł”. Wyniki zapytań są nadal buforowane po stronie serwera (`defineCachedFunction`).
- Brakująca cena wyświetla się jako „—”, nigdy jako „NaN zł”.
- Serwis ma tylko jasny motyw. Ciemny motyw systemu nie zmienia już kolorów przycisków.
- Lint: ESLint z modułu `@nuxt/eslint` zamiast Biome (lepsza obsługa plików `.vue`). TypeScript 6, bo TypeScript 7 nie działa jeszcze z typescript-eslint.

## [0.1.0] - 2026-11-17

### Dodano

- Szkielet projektu: Nuxt 4 (kod w `src/`), Tailwind CSS 4, DuckDB.
- Pobieranie Rejestru Produktów Leczniczych przez API dane.gov.pl (`scripts/fetch-data.ts`).
- Budowanie bazy DuckDB z pobranych danych (`scripts/build-db.ts`).
- Endpoint `GET /api/health` z liczbą produktów i datą danych.
- Testy (Vitest) na próbce danych w `tests/fixtures/`.
- ESLint, sprawdzanie typów i CI w GitHub Actions.
- Uruchamianie jedną komendą: `docker compose up`.
- Pliki open source: README, LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, szablony zgłoszeń i PR.

[Unreleased]: ../../compare/v0.1.0...HEAD
[0.1.0]: ../../releases/tag/v0.1.0
