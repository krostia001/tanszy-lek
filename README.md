# TańszyLek

Wyszukiwarka tańszych zamienników leków, zbudowana na otwartych danych z [dane.gov.pl](https://dane.gov.pl).

> 🚧 Projekt w budowie (17–22.11.2026). Poniższe instrukcje uruchomienia już działają.

## Jaki problem rozwiązujemy

Ten sam lek, czyli ta sama substancja czynna w tej samej dawce i postaci, jest sprzedawany pod różnymi nazwami handlowymi i w różnych cenach. Pacjenci często nie wiedzą, że istnieje tańszy odpowiednik, a informacje o lekach są rozproszone w urzędowych rejestrach, z których trudno korzystać na co dzień.

TańszyLek pozwala wpisać nazwę leku i zobaczyć jego odpowiedniki (ta sama substancja czynna, dawka i postać) oraz porównać ich ceny. Przykład z aktualnych danych: Atorvasterol 20 mg (30 tabl.) kosztuje 19,21 zł, a odpowiednik Atorvox 8,30 zł.

> ⚠️ Serwis ma charakter wyłącznie informacyjny. Decyzję o zamianie leku zawsze skonsultuj z lekarzem lub farmaceutą.

## Co potrafi

- **Wyszukiwanie z podpowiedziami** po nazwie leku lub substancji czynnej, odporne na literówki (np. „atorwasterol”).
- **Strona leku**: cena wybranego opakowania, tańsze odpowiedniki posortowane od najtańszego, ulotka i charakterystyka produktu.
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

Przy pierwszym uruchomieniu kontener `data` pobiera dane z API dane.gov.pl i buduje bazę (ok. 1 minuty). Potem aplikacja działa pod adresem **http://localhost:3000**.

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
- [Nuxt UI](https://ui.nuxt.com) i [Tailwind CSS 4](https://tailwindcss.com), fonty Barlow serwowane z własnej domeny
- [Vitest](https://vitest.dev), [ESLint](https://eslint.org), GitHub Actions, Docker

## Wydajność

Pierwsze pomiary (lokalnie, build produkcyjny):

| Zapytanie | Pierwsze wywołanie | Z pamięci podręcznej |
|---|---|---|
| Wyszukiwanie `/api/szukaj?q=atorv` | 20 ms | 3 ms |
| Lek z odpowiednikami `/api/lek/…` | 55 ms | 3 ms |

Zastosowane techniki: ciężka praca (czyszczenie danych, łączenie zbiorów, grupowanie odpowiedników) dzieje się raz, przy budowaniu bazy. Baza DuckDB działa w procesie serwera, tylko do odczytu i z indeksami. Odpowiedzi API są buforowane, a fonty i ikony są dołączane do buildu zamiast pobierania z zewnętrznych serwerów. Szczegółowe pomiary pojawią się w dokumentacji.

## Dokumentacja

Rejestr wszystkich dokumentów projektu: [`docs/README.md`](docs/README.md).

## Współtworzenie

Zgłoszenia błędów i propozycje zmian są mile widziane. Zobacz [`CONTRIBUTING.md`](CONTRIBUTING.md) i [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md). Historia zmian: [`CHANGELOG.md`](CHANGELOG.md).

## Licencja

Kod jest udostępniony na licencji [MIT](LICENSE). Dane pochodzą z portalu dane.gov.pl i podlegają warunkom wykorzystywania określonym przez ich wydawców.
