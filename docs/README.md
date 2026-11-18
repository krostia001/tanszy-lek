# Rejestr dokumentów

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-000 |
| Wersja | 1.1 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

## Zasady kontroli dokumentów

Dokumentacja projektu jest prowadzona zgodnie z wytycznymi **ISO 10013** (dokumentowanie informacji):

- **Identyfikator**: każdy dokument ma stały numer `TL-DOC-NNN`, który się nie zmienia.
- **Wersja**: `0.x` to projekt roboczy, `1.0` to wersja zatwierdzona, a każda kolejna zmiana podnosi numer.
- **Metryka**: dokumenty w `docs/` zaczynają się tabelą z identyfikatorem, wersją, statusem, autorem i datą (wzór: [szablon-dokumentu.md](szablon-dokumentu.md)). Pliki standardowe w katalogu głównym (README, CONTRIBUTING itd.) mają metrykę na końcu, żeby nie przeszkadzała w czytaniu na GitHubie.
- **Historia zmian**: każdy dokument ma tabelę zmian. Pełna historia jest też w historii git.
- **Przechowywanie**: wszystkie dokumenty znajdują się w repozytorium, w katalogu `docs/` oraz w katalogu głównym.
- **Zatwierdzanie**: dokument dostaje status „zatwierdzony”, gdy opisuje stan zgodny z kodem w gałęzi `main`.

## Lista dokumentów

| ID | Dokument | Wersja | Status |
|---|---|---|---|
| TL-DOC-000 | [Rejestr dokumentów](README.md) (ten plik) | 1.1 | zatwierdzony |
| TL-DOC-001 | [README](../README.md): opis projektu, źródła danych, uruchomienie | 1.1 | zatwierdzony |
| TL-DOC-002 | [CONTRIBUTING](../CONTRIBUTING.md): zasady współtworzenia | 1.0 | zatwierdzony |
| TL-DOC-003 | [CODE_OF_CONDUCT](../CODE_OF_CONDUCT.md): kodeks postępowania | 1.0 | zatwierdzony |
| TL-DOC-004 | [CHANGELOG](../CHANGELOG.md): historia zmian | 1.1 | zatwierdzony |
| TL-DOC-005 | [Opis danych i ich jakości](dane.md) | 1.0 | zatwierdzony |
| TL-DOC-006 | [Architektura](architektura.md) | 1.0 | zatwierdzony |
| TL-DOC-007 | [Wydajność i optymalizacja](wydajnosc.md) | 1.0 | zatwierdzony |
| TL-DOC-008 | [Raport końcowy](raport-koncowy.md) (szkielet ISO 21513) | 1.1 | zatwierdzony |
| TL-DOC-009 | [Lessons learned](lessons-learned.md) (wg PMI) | 1.0 | zatwierdzony |
| TL-DOC-010 | [Projekt graficzny](projekt-graficzny.md) | 1.0 | zatwierdzony |

Wzór nowego dokumentu: [szablon-dokumentu.md](szablon-dokumentu.md).

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 0.1 | 2026-11-17 | krostia001 | Utworzenie rejestru i zasad kontroli dokumentów |
| 1.0 | 2026-11-18 | krostia001 | Dodano dokumenty TL-DOC-005, 006, 008, 009; metryka w plikach standardowych; zatwierdzenie wszystkich dokumentów |
| 1.1 | 2026-11-18 | krostia001 | Wydanie v1.0.0: nowe wersje TL-DOC-001, 004 i 008 |
