# Opis danych i ich jakości

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-005 |
| Wersja | 1.0 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

## Cel dokumentu

Opisuje, skąd pochodzą dane, na jakich warunkach z nich korzystamy, jak je czyścimy i łączymy oraz jakie problemy z jakością znaleźliśmy. Liczby dotyczą migawki rejestru z 16.11.2026 i wykazu cen obowiązującego od 1.10.2026.

## Źródła

| | Rejestr Produktów Leczniczych | Wykaz refundowanych leków |
|---|---|---|
| Wydawca | Centrum e-Zdrowia | Ministerstwo Zdrowia |
| Gdzie | [dane.gov.pl, zbiór 397](https://dane.gov.pl/pl/dataset/397) | [gov.pl, załącznik do obwieszczenia](https://www.gov.pl/web/zdrowie/obwieszczenia-ministra-zdrowia-lista-lekow-refundowanych) |
| Jak pobieramy | API dane.gov.pl (`/1.4/datasets/397/resources`), plik CSV | stały adres załącznika XLSX (arkusz A1) |
| Aktualizacja u źródła | codziennie | co 2–3 miesiące (nowe obwieszczenie) |
| Warunki | CC BY 4.0, z obowiązkiem podania źródła i daty danych | akt urzędowy, nie podlega prawu autorskiemu (art. 4 ustawy o prawie autorskim) |
| Co bierzemy | nazwy, substancje, dawki, postacie, drogi podania, opakowania (GTIN), ulotki | cena urzędowa opakowania (cena detaliczna) |

Serwis podaje źródło i datę danych w stopce, na stronie leku i na stronie „O projekcie”, zgodnie z warunkami licencji.

Cen leków nie ma na dane.gov.pl, dlatego drugie źródło pochodzi z gov.pl. Adres pliku jest przypięty do konkretnego obwieszczenia (`scripts/lib/sources.ts`), żeby każdy, kto uruchomi skrypt, dostał ten sam wynik. Nowe obwieszczenie ustawia się zmiennymi `MZ_REFUND_XLSX_URL` i `MZ_REFUND_EDITION`.

## Przepływ danych

```
API dane.gov.pl ──► rpl.csv (17 MB) ─┐
                                      ├─► scripts/build-db.ts (DuckDB, SQL) ─► data/app.duckdb (ok. 24 MB)
gov.pl (XLSX) ─► mz-refundacja.xlsx ─┘
```

1. `scripts/fetch-data.ts` pobiera oba pliki do `data/raw/` i zapisuje metadane (wydanie, data danych, adres) w `sources.json`.
2. `scripts/build-db.ts` wczytuje pliki do DuckDB, czyści je i buduje tabele dla aplikacji. Cały krok trwa ok. 4 s.
3. Aplikacja otwiera gotową bazę tylko do odczytu.

## Tabele wynikowe

| Tabela | Zawartość | Wierszy |
|---|---|---|
| `products` | leki dla ludzi z ważnym pozwoleniem, z adresem strony i kluczem grupy odpowiedników | 18 078 |
| `packages` | aktywne opakowania (GTIN, wielkość, kategoria dostępności) | 51 828 |
| `prices` | ceny z wykazu MZ, po jednym wierszu na opakowanie i wskazanie | 4 282 |
| `search_index` | jeden wiersz na nazwę, dawkę i postać, z nazwą bez polskich znaków | 14 946 |
| `examples` | przykłady oszczędności na stronę główną | 4 |
| `sources` | wydania i daty źródeł | 2 |

## Czyszczenie i łączenie

| Problem w danych źródłowych | Skala | Co robimy |
|---|---|---|
| Rejestr zawiera leki weterynaryjne | 2 649 z 23 000 wierszy | pomijamy |
| Pozwolenie wygasło przed datą migawki | 2 273 leki | pomijamy |
| Kilka opakowań zapisanych w jednym polu tekstowym („GTIN ¦ kategoria ¦ id” i wielkość w osobnej linii) | 77 903 opakowania | rozbijamy wyrażeniem regularnym na osobne wiersze |
| Opakowania skreślone z rejestru („Skasowane”) | 4 131 | pomijamy |
| Ta sama dawka zapisana jako „mcg” i „µg” | 911 i 19 leków | ujednolicamy do „µg” |
| Droga podania zapisana na dwa sposoby („doustna”, „podanie doustne”) | 333 leki | ujednolicamy, kilka dróg sortujemy |
| Brak dawki („-”) | 832 leki | taki lek nie dostaje grupy odpowiedników |
| Ceny w polskim formacie („1 234,56”) | wszystkie | zamieniamy na liczby |
| Nagłówek XLSX w drugim wierszu, tytuł arkusza w pierwszym | — | czytamy od wiersza 2 |
| To samo opakowanie w kilku wierszach wykazu (różne wskazania) | 270 kodów GTIN | cena urzędowa jest ta sama, bierzemy jeden wiersz |
| Import równoległy: ta sama marka od kilku importerów | 4 329 leków | zostawiamy, ale na liście odpowiedników pokazujemy markę w danej cenie raz |

Oba źródła łączymy po kodzie GTIN opakowania. Z 4 010 kodów z wykazu MZ **3 649 (91%)** znajduje się wśród aktywnych opakowań rejestru. Z pozostałych 361 kodów 29 należy do leków z wygasłym pozwoleniem, a 332 w ogóle nie występuje w pliku rejestru. Tych cen nie pokazujemy, bo nie wiemy, do którego leku należą. To rozbieżność między dwoma urzędowymi źródłami, którą warto zgłosić wydawcom.

## Jak wybieramy odpowiedniki

Lek dostaje klucz grupy: substancja czynna (nazwa międzynarodowa), dawka po ujednoliceniu, postać i droga podania. Leki z tym samym kluczem to odpowiedniki.

Tabletki, tabletki powlekane, tabletki drażowane i kapsułki traktujemy jako tę samą postać. Między nimi nie ma różnicy o znaczeniu klinicznym. Postacie o zmodyfikowanym uwalnianiu, kapsułki miękkie, syropy i inne porównujemy tylko z identyczną postacią. Wynik: 7 151 grup, a 9 162 z 14 946 pozycji wyszukiwarki ma co najmniej jeden odpowiednik.

Ceny porównujemy tylko dla opakowań z tą samą liczbą sztuk.

## Kontrola jakości

- **Testy na próbkach prawdziwych danych** (`tests/load.test.ts`): weterynaryjne i wygasłe leki są pomijane, skreślone opakowania nie trafiają do bazy, „mcg” i „µg” oraz dwa zapisy drogi podania dają tę samą grupę, ceny są poprawnie zamieniane na liczby. Próbki wycina z pełnych danych skrypt `scripts/make-fixtures.ts`.
- **Kontrola końcowa**: `build-db.ts` po każdym budowaniu wypisuje liczby wierszy w tabelach, więc nagły spadek (np. zmiana formatu pliku u źródła) widać od razu.
- **Odporność na system operacyjny**: parser opakowań działa z końcami linii LF i CRLF.
- **Zgłoszenia od użytkowników**: osobny szablon „Błąd w danych” w repozytorium.

## Ograniczenia

- Ceny znamy tylko dla leków z wykazu MZ (leki refundowane). Ceny pozostałych leków ustala apteka.
- Pokazujemy cenę urzędową opakowania. Pacjent z receptą refundowaną płaci mniej, bo część ceny pokrywa NFZ.
- Odpowiedniki mogą różnić się substancjami pomocniczymi. Serwis nie zastępuje porady farmaceuty.
- Wykaz MZ trzeba ręcznie wskazać po każdym nowym obwieszczeniu.

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 1.0 | 2026-11-18 | krostia001 | Pierwsza wersja |
