# Jak współtworzyć TańszyLek

Dziękujemy, że chcesz pomóc! Każde zgłoszenie błędu, poprawka w danych czy propozycja jest cenna.

## Zgłaszanie błędów i propozycji

Otwórz [zgłoszenie (issue)](../../issues/new/choose) i wybierz szablon:

- **Błąd w aplikacji**: coś nie działa lub działa inaczej, niż powinno.
- **Błąd w danych**: lek ma złe informacje, brakuje zamiennika itp. Jeśli błąd jest w samym rejestrze źródłowym, przekażemy go wydawcy danych.
- **Propozycja zmiany**: pomysł na nową funkcję lub ulepszenie.

Zanim otworzysz nowe zgłoszenie, sprawdź, czy podobne już nie istnieje.

## Wprowadzanie zmian

1. Zrób fork repozytorium i utwórz gałąź od `main`, np. `fix/wyszukiwanie-polskie-znaki`.
2. Przygotuj środowisko:

   ```bash
   bun install
   bun run data   # pobiera dane z dane.gov.pl
   bun run dev
   ```

3. Wprowadź zmiany. Dodaj lub zaktualizuj testy w `tests/`.
4. Przed wysłaniem sprawdź, czy wszystko przechodzi (to samo uruchamia CI przy każdym PR):

   ```bash
   bun run lint
   bun run typecheck
   bun run test
   ```

5. Dopisz zmianę w [`CHANGELOG.md`](CHANGELOG.md) w sekcji `[Unreleased]`.
6. Otwórz pull request i wypełnij szablon.

## Zasady

- **Styl kodu** pilnuje ESLint (`bun run lint:fix` poprawia większość rzeczy automatycznie).
- **Język**: interfejs i dokumentacja po polsku, kod i komentarze w kodzie po angielsku.
- **Commity**: krótko i w trybie rozkazującym, najlepiej w stylu [Conventional Commits](https://www.conventionalcommits.org/pl/v1.0.0/), np. `feat: wyszukiwanie po substancji czynnej`, `fix: polskie znaki w nazwach leków`.
- **Dane** nie trafiają do repozytorium (katalog `data/` jest ignorowany). Do testów służy mała próbka w `tests/fixtures/`.
- **Sekrety** (klucze, hasła) nigdy nie trafiają do kodu, tylko do zmiennych środowiskowych (`.env`, wzór w `.env.example`).

## Wskazówka dla Windows

Windows blokuje plik bazy otwarty przez działający serwer. Przed `bun run data:build` zatrzymaj `bun run dev`.

## Kodeks postępowania

Uczestnicząc w projekcie, zobowiązujesz się przestrzegać [Kodeksu postępowania](CODE_OF_CONDUCT.md).
