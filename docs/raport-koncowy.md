# Raport końcowy projektu

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-008 |
| Wersja | 1.1 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

Struktura raportu odpowiada szkieletowi ISO 21513 wskazanemu w wymaganiach projektu: cel, rezultaty, porównanie z planem, wpływ, wnioski.

## 1. Podsumowanie

TańszyLek to otwarta wyszukiwarka tańszych odpowiedników leków. Łączy Rejestr Produktów Leczniczych z dane.gov.pl z cenami z wykazu Ministerstwa Zdrowia i pokazuje, który lek z tą samą substancją, dawką i postacią kosztuje mniej. Projekt powstał w ciągu tygodnia (17–22.11.2026), jest dostępny jako repozytorium open source i uruchamia się jedną komendą.

## 2. Cel projektu

**Problem społeczny.** Ten sam lek jest sprzedawany pod wieloma nazwami w różnych cenach. Dane, które to pokazują, są publiczne, ale rozproszone: rejestr leków to plik CSV z 23 000 wierszy, a ceny są w osobnym arkuszu XLSX publikowanym co 2–3 miesiące. Pacjent nie ma prostego sposobu, żeby sprawdzić, czy istnieje tańszy odpowiednik jego leku.

**Cel.** Zbudować w tydzień serwis, w którym każdy po wpisaniu nazwy leku zobaczy jego tańsze odpowiedniki i ich ceny, oparty na otwartych danych i spełniający wymagania projektu.

| Cel szczegółowy | Miara sukcesu |
|---|---|
| C1. Wyszukiwarka odpowiedników z cenami | działające demo: wyszukiwanie, strona leku, lista tańszych odpowiedników |
| C2. Dane z dane.gov.pl, powtarzalne | skrypt pobiera dane przez API i buduje bazę od zera |
| C3. Repozytorium zgodne z dobrymi praktykami open source | komplet plików standardowych, struktura `src/ tests/ docs/`, CI z testami i lintem |
| C4. Łatwe uruchomienie | `docker compose up` działa na czystej maszynie |
| C5. Wydajność | zmierzona i udokumentowana, z opisem technik |
| C6. Dokumentacja | raport końcowy, lessons learned, kontrola dokumentów wg ISO 10013 |

## 3. Rezultaty

| Cel | Rezultat | Dowód |
|---|---|---|
| C1 | 4 strony: główna z wyszukiwarką i przykładami oszczędności, strona leku z ceną i tańszymi odpowiednikami, wyniki wyszukiwania (z tolerancją literówek), „O projekcie” w formie ulotki | [README](../README.md), demo |
| C2 | 18 078 leków, 51 828 opakowań, 3 649 opakowań z ceną, 9 162 pozycje z co najmniej jednym odpowiednikiem; pełna przebudowa danych w ok. 15 s | [TL-DOC-005 Opis danych](dane.md) |
| C3 | repozytorium [github.com/krostia001/tanszy-lek](https://github.com/krostia001/tanszy-lek) na licencji MIT, szablony zgłoszeń (w tym „Błąd w danych”) i PR, CI zielone od pierwszego pushu, 33 testy na próbkach prawdziwych danych | [CONTRIBUTING](../CONTRIBUTING.md), [CI](https://github.com/krostia001/tanszy-lek/actions) |
| C4 | `docker compose up`: obraz w ok. 2 min, dane w ok. 15 s, kolejne uruchomienia w kilka sekund; sprawdzone od zera | [README](../README.md) |
| C5 | Lighthouse (telefon) 100/100/100/100 na wszystkich stronach, treść widoczna po 0,8 s, strona ok. 220 KiB; API 5–10 ms (p50) | [TL-DOC-007 Wydajność](wydajnosc.md) |
| C6 | 11 dokumentów z metryką i historią zmian w [rejestrze dokumentów](README.md) | ten raport, [TL-DOC-009 Lessons learned](lessons-learned.md) |

## 4. Porównanie z planem

### Harmonogram

| Dzień | Plan | Wykonanie |
|---|---|---|
| Wt 17.11 | wybór pomysłu, sprawdzenie danych, szkielet repozytorium, CI | wszystko z planu oraz pobieranie danych, model danych, API, 4 strony, projekt graficzny i testy (praca z wyprzedzeniem) |
| Śr 18.11 | skrypty pobierania i czyszczenia danych, testy | poprawki prezentacji cen po testach z użytkownikiem, publiczne repozytorium i CI, weryfikacja Dockera, optymalizacja i pomiary, dokumentacja, wydanie v1.0.0 |
| Cz 19.11 | API i strony | zrobione wcześniej |
| Pt 20.11 | interfejs, wersja mobilna, Docker, wdrożenie | zrobione wcześniej (wdrożenie: patrz zmiany zakresu) |
| Sb 21.11 | optymalizacja, pomiary, dokumentacja | zrobione wcześniej |
| Nd 22.11 | bufor, próba demo | zaplanowane: próba demo |

Projekt wyprzedził harmonogram o ok. 3 dni. Główny powód: wcześnie sprawdzone dane (pierwszego dnia) i automatyczne testy, które pozwalały szybko wprowadzać zmiany.

### Zmiany zakresu i rozwiązań

| Obszar | Plan | Wykonanie | Powód |
|---|---|---|---|
| Baza danych | DuckDB | rozważano Neon (Postgres w chmurze), zostało DuckDB | Neon utrudniał uruchomienie jedną komendą |
| Interfejs | Vue + Vite | Nuxt 4 | lepsza znajomość frameworka u autora, renderowanie na serwerze |
| Biblioteka komponentów | brak | Nuxt UI dodany, potem usunięty | używane były tylko dwie ikony, a biblioteka dodawała 171 kB CSS |
| Lint | Biome | ESLint (`@nuxt/eslint`) | lepsza obsługa plików `.vue` |
| Prezentacja cen | dopłata pacjenta | cena urzędowa opakowania | testy z użytkownikiem: dopłata (np. 4 zł) wyglądała jak błąd |
| Wdrożenie | publiczny adres | demo z laptopa, `docker compose up` | wymagania nie określają formy demo |
| Poza zakresem | — | wykazy bezpłatnych leków 65+ i DZ, automatyczne wykrywanie nowego obwieszczenia MZ, strona statystyk | czas; opisane w rekomendacjach |
| Ponad plan | — | skrypty pomiarów, lżejszy obraz Dockera (623 MB zamiast 1 GB), odporność na końce linii CRLF | wnioski z testów i pomiarów |

## 5. Wpływ

**Dla pacjentów.** Na 3 649 opakowań z ceną w wykazie MZ aż 1 827 (50%) ma tańszy odpowiednik w opakowaniu tej samej wielkości. Mediana różnicy to 3,82 zł na opakowaniu, a w 71 grupach leków różnica przekracza 20 zł. Przykład: Atorvasterol 20 mg (30 tabl.) kosztuje 19,21 zł, a odpowiednik Atorvox 8,30 zł. Przy jednej tabletce dziennie to ok. 130 zł rocznie na jednym leku. Są to różnice cen urzędowych; pacjent z receptą refundowaną płaci mniej, bo część ceny pokrywa NFZ, więc jego oszczędność bywa mniejsza.

**Dostępność.** Serwis jest projektowany dla starszych osób: większy tekst (18 px), kontrast zgodny z WCAG AA, obsługa klawiaturą, wynik 100 w audycie dostępności Lighthouse. Przypomina też o prawie pacjenta: farmaceuta ma obowiązek poinformować o tańszym odpowiedniku (art. 44 ustawy o refundacji).

**Dla otwartych danych.** Projekt pokazuje, jak połączyć dwa urzędowe źródła i jakie mają problemy jakościowe: m.in. 332 kody GTIN z wykazu MZ, których nie ma w rejestrze, kilka zapisów tej samej dawki i drogi podania, wiele opakowań w jednym polu tekstowym. Proces jest w pełni powtarzalny, więc każdy może go sprawdzić, rozwinąć lub wykorzystać w innym projekcie.

## 6. Wnioski

1. **Cel osiągnięty.** Wszystkie cele szczegółowe C1–C6 zostały zrealizowane i mają mierzalne dowody.
2. **Dane trzeba sprawdzić przed wyborem pomysłu.** Pierwszego dnia okazało się, że cen nie ma na dane.gov.pl. Wcześnie znaleźliśmy drugie źródło i nie przebudowywaliśmy projektu w połowie.
3. **Test z jednym użytkownikiem zmienił najważniejszy ekran.** Bez niego serwis pokazywałby kwoty, które odbiorca odczytuje jako błąd.
4. **Mierzenie przed optymalizacją się opłaca.** Pomiar Lighthouse wskazał, że największy koszt to nieużywana biblioteka komponentów, a nie kod aplikacji.

Szczegółowe wnioski: [TL-DOC-009 Lessons learned](lessons-learned.md).

### Rekomendacje dalszego rozwoju

- Automatyczne odświeżanie danych (zaplanowany workflow w GitHub Actions) i wykrywanie nowego obwieszczenia MZ.
- Wykazy bezpłatnych leków dla osób 65+ i dzieci (S i DZ) oraz porównanie ceny za tabletkę między różnymi opakowaniami.
- Zgłoszenie wydawcom rozbieżności w kodach GTIN.
- Publiczny adres serwisu (np. kontener na hostingu w Polsce).

## Organizacja projektu

Projekt indywidualny. Kod i dokumentacja powstały przy pomocy asystenta AI (Claude Code). Decyzje produktowe, wybór pomysłu, kierunku graficznego i sposobu prezentacji cen podejmował autor.

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 1.0 | 2026-11-18 | krostia001 | Pierwsza wersja raportu |
| 1.1 | 2026-11-18 | krostia001 | Wydanie v1.0.0 w harmonogramie |
