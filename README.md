# TańszyLek

[![CI](https://github.com/krostia001/tanszy-lek/actions/workflows/ci.yml/badge.svg)](https://github.com/krostia001/tanszy-lek/actions/workflows/ci.yml)
[![Licencja: MIT](https://img.shields.io/badge/licencja-MIT-green.svg)](LICENSE)

Wyszukiwarka tańszych zamienników leków, zbudowana na otwartych danych z [dane.gov.pl](https://dane.gov.pl).

> Wersja 1.1.0 z 26.11.2026. Co się zmieniło: [`CHANGELOG.md`](CHANGELOG.md).

## Jaki problem rozwiązujemy

Ten sam lek, czyli ta sama substancja czynna w tej samej dawce i postaci, jest sprzedawany pod różnymi nazwami handlowymi i w różnych cenach. Pacjenci często nie wiedzą, że istnieje tańszy odpowiednik, a informacje o lekach są rozproszone w urzędowych rejestrach, z których trudno korzystać na co dzień.

TańszyLek pozwala wpisać nazwę leku i zobaczyć jego odpowiedniki (ta sama substancja czynna, dawka i postać) oraz porównać ich ceny. Przykład z aktualnych danych: Atorvasterol 20 mg (30 tabl.) kosztuje 19,21 zł, a odpowiednik Atorvox 8,30 zł.

> ⚠️ Serwis ma charakter wyłącznie informacyjny. Decyzję o zamianie leku zawsze skonsultuj z lekarzem lub farmaceutą.

## Co potrafi

- **Wyszukiwanie z podpowiedziami** po nazwie leku lub substancji czynnej, odporne na literówki (np. „atorwasterol”).
- **Strona leku**: cena wybranego opakowania i cena za tabletkę, tańsze odpowiedniki posortowane od najtańszego, ulotka i charakterystyka produktu.
- **Porównanie ceny za tabletkę**: odpowiedniki i ten sam lek w innej wielkości opakowania (np. 90 tabletek zamiast 30), jeśli wychodzą taniej.
- **Udostępnianie**: link do leku z wybranym opakowaniem, np. żeby wysłać tańszą opcję bliskiej osobie.
- **Przykłady oszczędności** na stronie głównej, liczone automatycznie z aktualnych danych.
- **Strona „O projekcie”** napisana jak ulotka: źródła danych, sposób wyboru odpowiedników, ograniczenia.

## Skąd są dane

| Zbiór | Wydawca | Aktualizacja | Źródło |
|---|---|---|---|
| Rejestr Produktów Leczniczych | Centrum e-Zdrowia | codziennie | [dane.gov.pl/pl/dataset/397](https://dane.gov.pl/pl/dataset/397), przez API |
| Wykaz refundowanych leków (ceny urzędowe) | Ministerstwo Zdrowia | co 2–3 miesiące | [gov.pl](https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych), załącznik XLSX |

Rejestr jest głównym źródłem i pobieramy go przez [API dane.gov.pl](https://api.dane.gov.pl/doc). Cen leków nie ma na dane.gov.pl, dlatego bierzemy je z wykazu Ministerstwa Zdrowia. Oba zbiory łączymy po kodzie opakowania GTIN.

Dane **nie są przechowywane w repozytorium**. Skrypt [`scripts/fetch-data.ts`](scripts/fetch-data.ts) pobiera je, a [`scripts/build-db.ts`](scripts/build-db.ts) buduje z nich bazę DuckDB. Dzięki temu każdy może odtworzyć wynik od zera. W repozytorium jest tylko mała próbka do testów ([`tests/fixtures/`](tests/fixtures/)), wycięta z prawdziwych danych skryptem [`scripts/make-fixtures.ts`](scripts/make-fixtures.ts).

Adres wykazu MZ jest przypięty do konkretnego obwieszczenia, żeby wynik był powtarzalny. Po publikacji nowego obwieszczenia ustaw `MZ_REFUND_XLSX_URL` i `MZ_REFUND_EDITION` (patrz [`.env.example`](.env.example)).

## Uruchomienie

### Docker: jedna komenda

Wymagany jest tylko [Docker](https://docs.docker.com/get-docker/).

```bash
docker compose up
```

Przy pierwszym uruchomieniu Docker buduje obraz (ok. 2 minut), a kontener `data` pobiera dane z API dane.gov.pl i buduje bazę (ok. 15 sekund). Potem aplikacja działa pod adresem **http://localhost:3000**. Kolejne uruchomienia trwają kilka sekund, bo dane zostają w wolumenie Dockera.

Odświeżenie danych do najnowszej wersji:

```bash
docker compose run --rm data bun run data
docker compose restart app
```

### Lokalnie (tryb deweloperski)

Wymagane: [Bun](https://bun.sh) 1.4+ i [Node.js](https://nodejs.org) 22+.

```bash
bun install
bun run data   # pobiera dane z dane.gov.pl i buduje data/app.duckdb
bun run dev    # http://localhost:3000
```

Konfiguracja (opcjonalna) znajduje się w [`.env.example`](.env.example). Projekt nie wymaga żadnych kluczy ani haseł.

## Polecenia

| Polecenie | Co robi |
|---|---|
| `bun run dev` | serwer deweloperski z podglądem zmian na żywo |
| `bun run build` | build produkcyjny do `.output/` |
| `bun run data` | `data:fetch` + `data:build` |
| `bun run data:fetch` | pobiera pliki źródłowe z API dane.gov.pl do `data/raw/` |
| `bun run data:build` | buduje bazę `data/app.duckdb` z plików w `data/raw/` |
| `bun scripts/make-fixtures.ts` | odświeża próbki danych do testów w `tests/fixtures/` |
| `bun run lint` | ESLint (jakość i formatowanie kodu) |
| `bun run typecheck` | sprawdzanie typów TypeScript |
| `bun run test` | testy (Vitest) |
| `bun run bench` | czas odpowiedzi działającej aplikacji (p50, p95), domyślnie `http://localhost:3000` |
| `bun run lighthouse` | Lighthouse w profilu mobilnym dla głównych stron (wymaga Google Chrome) |

## Struktura repozytorium

```
.github/          szablony zgłoszeń i PR, CI (GitHub Actions)
docs/             dokumentacja projektu (rejestr dokumentów: docs/README.md)
scripts/          pobieranie danych z dane.gov.pl i budowanie bazy
src/              kod aplikacji (Nuxt): strony, komponenty, API serwera
tests/            testy i mała próbka danych (fixtures/)
data/             dane pobrane przez skrypty (poza repozytorium)
```

## Technologie

- [Nuxt 4](https://nuxt.com) (Vue, renderowanie po stronie serwera)
- [DuckDB](https://duckdb.org): analityczna baza danych działająca w procesie aplikacji, bez osobnego serwera
- [Bun](https://bun.sh): instalacja pakietów i skrypty danych
- [Tailwind CSS 4](https://tailwindcss.com), fonty Barlow serwowane z własnej domeny ([@nuxt/fonts](https://fonts.nuxt.com))
- [Vitest](https://vitest.dev), [ESLint](https://eslint.org), GitHub Actions, Docker

## Wydajność

Lighthouse (profil mobilny): **100** w wydajności, dostępności, dobrych praktykach i SEO na wszystkich stronach. Treść pojawia się po 0,8 s na symulowanym wolnym 4G, a strona waży ok. 220 KiB.

| Zapytanie (build produkcyjny, 10 równoległych klientów) | p50 | p95 |
|---|---|---|
| Wyszukiwanie `/api/szukaj?q=atorv` | 5 ms | 9 ms |
| Lek z odpowiednikami `/api/lek/…` | 10 ms | 19 ms |
| Cała strona leku (HTML) | 58 ms | 73 ms |

Najważniejsze techniki: ciężka praca (czyszczenie, łączenie zbiorów, grupowanie odpowiedników) dzieje się raz przy budowaniu bazy, DuckDB działa w procesie serwera z indeksami, wyniki zapytań są buforowane, HTML i JSON są kompresowane (brotli), a z interfejsu usunęliśmy bibliotekę komponentów (CSS z 192 kB do 21 kB). Pomiary przed i po, metoda i kompromisy: [`docs/wydajnosc.md`](docs/wydajnosc.md).

## Dokumentacja

Rejestr wszystkich dokumentów projektu z zasadami kontroli dokumentów (ISO 10013): [`docs/README.md`](docs/README.md). Najważniejsze:

- [Raport końcowy](docs/raport-koncowy.md): cel, rezultaty, porównanie z planem, wpływ, wnioski
- [Lessons learned](docs/lessons-learned.md): co zadziałało, co nie, co zrobilibyśmy inaczej, rekomendacje
- [Opis danych i ich jakości](docs/dane.md): źródła, licencje, czyszczenie, łączenie, problemy w danych
- [Architektura](docs/architektura.md): części systemu, API, decyzje projektowe
- [Wydajność](docs/wydajnosc.md): pomiary przed i po optymalizacji, techniki, kompromisy

## Współtworzenie

Zgłoszenia błędów i propozycje zmian są mile widziane. Zobacz [`CONTRIBUTING.md`](CONTRIBUTING.md) i [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Historia zmian: [`CHANGELOG.md`](CHANGELOG.md).

## Licencja

Kod jest udostępniony na licencji [MIT](LICENSE). Rejestr Produktów Leczniczych jest udostępniany na dane.gov.pl na licencji CC BY 4.0 (źródło i datę danych podajemy w serwisie). Wykaz leków refundowanych to dokument urzędowy Ministerstwa Zdrowia.

## Metryka dokumentu

| Identyfikator | Wersja | Status | Autor | Data |
|---|---|---|---|---|
| TL-DOC-001 | 1.3 | zatwierdzony | krostia001 | 2026-11-26 |

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 0.1 | 2026-11-17 | krostia001 | Pierwsza wersja: opis, źródła, uruchomienie |
| 1.0 | 2026-11-18 | krostia001 | Ceny MZ, wyniki wydajności, dokumentacja, zmierzony czas uruchomienia w Dockerze |
| 1.1 | 2026-11-18 | krostia001 | Wydanie 1.0.0 zamiast informacji „w budowie” |
| 1.2 | 2026-11-26 | krostia001 | Porównanie ceny za tabletkę i udostępnianie w opisie funkcji |
| 1.3 | 2026-11-26 | krostia001 | Wydanie 1.1.0 |
