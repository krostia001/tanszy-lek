# Architektura

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-006 |
| Wersja | 1.0 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

## Cel dokumentu

Opisuje, z jakich części składa się TańszyLek, jak przepływają dane i dlaczego wybraliśmy takie rozwiązania. Dla osób, które chcą rozwijać projekt.

## Widok ogólny

```
                 ┌──────────────── budowanie danych (raz, skrypty) ────────────────┐
API dane.gov.pl ─┤  scripts/fetch-data.ts ─► data/raw/ ─► scripts/build-db.ts      │
gov.pl (XLSX) ───┤                                         (DuckDB, SQL)            │
                 └──────────────────────────────┬───────────────────────────────────┘
                                                ▼
                                       data/app.duckdb (tylko odczyt)
                                                │
                 ┌──────────────── aplikacja (Nuxt 4, serwer Nitro) ───────────────┐
                 │  src/server/api/*  ─► bufor wyników (defineCachedFunction)       │
                 │  src/pages/*       ─► HTML renderowany na serwerze               │
                 │  pluginy: kompresja brotli/gzip, cache-control dla API           │
                 └──────────────────────────────┬───────────────────────────────────┘
                                                ▼
                                    przeglądarka (Vue, Tailwind)
```

## Części systemu

| Część | Gdzie | Rola |
|---|---|---|
| Pobieranie danych | `scripts/fetch-data.ts`, `scripts/lib/dane-gov.ts`, `scripts/lib/sources.ts` | lista źródeł, klient API dane.gov.pl, zapis plików i metadanych |
| Budowanie bazy | `scripts/build-db.ts`, `scripts/lib/load.ts` | wszystkie kroki SQL: czyszczenie, łączenie, grupy odpowiedników, indeksy |
| Dostęp do bazy | `src/server/utils/duckdb.ts` | jedno połączenie tylko do odczytu, zapytania z parametrami |
| API | `src/server/api/` | wyszukiwanie, lek z odpowiednikami, przykłady, źródła, stan serwisu |
| Strony | `src/pages/`, `src/components/`, `src/layouts/` | główna, lek, wyniki wyszukiwania, „O projekcie”, strona błędu |
| Wspólne typy | `src/shared/` | kształt odpowiedzi API, normalizacja tekstu |
| Pomiary | `scripts/benchmark.ts`, `scripts/lighthouse.ts` | czas odpowiedzi i Lighthouse (patrz TL-DOC-007) |

## API

| Adres | Odpowiedź | Bufor na serwerze |
|---|---|---|
| `GET /api/szukaj?q=…&limit=…` | lista leków pasujących do nazwy lub substancji, z tolerancją literówek | 1 h |
| `GET /api/lek/{adres}` | lek, jego opakowania z cenami i odpowiedniki | 24 h |
| `GET /api/przyklady` | przykłady oszczędności na stronę główną | 24 h |
| `GET /api/zrodla` | wydania i daty źródeł danych | 1 h |
| `GET /api/health` | liczba leków i opakowań z ceną (do monitorowania) | brak |

Wszystkie zapytania SQL dostają dane od użytkownika wyłącznie jako parametry (`$nazwa`), nigdy przez sklejanie tekstu.

## Decyzje projektowe

| Decyzja | Dlaczego | Rozważane alternatywy |
|---|---|---|
| DuckDB w procesie serwera, plik tylko do odczytu | dane zmieniają się rzadko i nikt ich nie zapisuje, więc osobny serwer bazy byłby zbędny; brak opóźnień sieciowych; SQL dobrze radzi sobie z nieuporządkowanymi CSV i XLSX | Neon (Postgres w chmurze): trudniejsze uruchomienie jedną komendą i opóźnienia po „uśpieniu” bazy |
| Cała obróbka danych przy budowaniu bazy | zapytania w aplikacji są proste i szybkie; wynik jest powtarzalny i testowalny | obróbka przy każdym zapytaniu |
| Nuxt 4 z renderowaniem na serwerze | treść jest w HTML od razu (szybkie pierwsze wyświetlenie, SEO: każdy lek ma własny adres) | Vue + Vite (aplikacja tylko w przeglądarce) |
| Bez biblioteki komponentów | używaliśmy z niej dwóch ikon, a dodawała 171 kB CSS | Nuxt UI (używany na początku, usunięty) |
| Bufor wyników na serwerze, przeglądarka zawsze pyta serwer | szybkie odpowiedzi bez ryzyka, że przeglądarka pokaże stare ceny po aktualizacji danych | bufor HTTP w przeglądarce (powodował wyświetlanie starych danych) |
| Cena urzędowa opakowania zamiast dopłaty pacjenta | prostsza do zrozumienia; dopłata zależy od wskazania i uprawnień pacjenta | dopłata z rozbiciem na refundację (testy z użytkownikiem pokazały, że jest myląca) |
| Bun do skryptów i instalacji, Node do serwera | Bun szybko uruchamia TypeScript bez kompilacji; Node to standardowe środowisko dla buildu Nuxt | tylko Bun albo tylko Node |

## Uruchomienie i wdrożenie

- **Docker Compose** (`docker-compose.yml`): usługa `data` przy pierwszym starcie pobiera dane i buduje bazę w wolumenie, a potem kończy pracę. Usługa `app` startuje dopiero po niej i czyta bazę z tego samego wolumenu tylko do odczytu.
- **Obraz** (`Dockerfile`): budowanie wieloetapowe; w obrazie końcowym jest tylko zbudowana aplikacja, skrypty danych i Bun. Działa jako nieuprzywilejowany użytkownik `node`.
- **CI** (`.github/workflows/ci.yml`): przy każdym pull requeście i każdym pushu do `main` uruchamia lint, sprawdzanie typów, testy i build.

## Konfiguracja

Wszystkie ustawienia to zmienne środowiskowe (wzór w `.env.example`): port, ścieżka do bazy, adres API dane.gov.pl, adres wykazu MZ i link do repozytorium. Projekt nie potrzebuje żadnych kluczy ani haseł.

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 1.0 | 2026-11-18 | krostia001 | Pierwsza wersja |
