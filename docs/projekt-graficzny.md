# Projekt graficzny

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-010 |
| Wersja | 1.0 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

## Cel dokumentu

Opisuje kierunek wizualny serwisu, tokeny projektowe i decyzje, które za nimi stoją. Dla osób, które rozwijają interfejs.

## Odbiorca i główne zadanie

- **Kto**: pacjenci, często starsze osoby, oraz ich opiekunowie. Zwykle na telefonie, z receptą lub opakowaniem leku w ręce.
- **Główne zadanie strony**: w kilka sekund pokazać, ile można nie przepłacać za ten sam lek.

## Kierunek: „Szyld apteki”

Punktem wyjścia jest zielony krzyż i szyld polskiej apteki, czyli coś, co każdy pacjent zna. Jedynym mocnym elementem jest zielony pas nagłówka z krzyżem w formie podświetlanego kasetonu. Reszta strony jest spokojna: biel, cienkie linie, wiersze zamiast kart.

### Kolory

| Token | Wartość | Rola |
|---|---|---|
| `apteka-600` | `#00843D` | szyld, przyciski, oszczędność |
| `apteka-900` | `#0B3D2C` | kolor tekstu (zamiast czerni) |
| `apteka-50` | `#EAF7EF` | wyróżnienie najtańszego odpowiednika i ceny |
| `ink-600` | `#55645B` | tekst pomocniczy (kontrast 6,2:1) |
| `ink-200` | `#D3DED7` | linie podziału |
| `#FFFFFF` | | tło |

Biały tekst na `apteka-600` ma kontrast 4,8:1, a tekst `apteka-900` na białym ponad 12:1 (WCAG AA). Dlatego cały tekst na zielonym pasie jest biały: jaśniejsze odcienie zieleni (`apteka-50`, `apteka-100`) miały tylko 4,4:1 i 3,9:1.

### Typografia

- **Barlow Semi Condensed 700**: nagłówki. Barlow powstał na wzór liternictwa szyldów i znaków drogowych.
- **Barlow 400/500**: tekst. Bazowy rozmiar 18 px (`html { font-size: 112.5% }`), bo wielu użytkowników to osoby starsze.
- Ceny mają cyfry o stałej szerokości (`tabular-nums`), żeby kolumny kwot się nie rozjeżdżały.

### Układ

- Treść w jednej kolumnie wyrównanej do lewej (do 48 rem), pas szyldu na całą szerokość.
- Na stronie leku najpierw opakowanie, cena i tańsze odpowiedniki. Szczegóły leku są niżej, bo na telefonie spychały ceny poza pierwszy ekran.
- Listy to wiersze z liniami podziału, a nie karty. Najtańsze odpowiedniki mają miętowe tło.

### Ruch

Jedyna animacja to krzyż, który „zapala się” raz po wczytaniu strony głównej, jak szyld apteki o zmierzchu. Przy ustawieniu `prefers-reduced-motion` animacja jest wyłączona.

## Czego świadomie unikamy

Kafelków ze statystykami w nagłówku, gradientów, identycznych kart z cieniem, etykiet pisanych wersalikami nad nagłówkami i metadanych łączonych kropkami. To typowe cechy szablonowych stron. Numeracja 1, 2, 3 pojawia się tylko tam, gdzie treść naprawdę jest sekwencją: w krokach „Jak to działa” i w rozdziałach strony „O projekcie” napisanej jak ulotka.

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 0.1 | 2026-11-17 | krostia001 | Pierwsza wersja: kierunek, tokeny, układ |
| 1.0 | 2026-11-18 | krostia001 | Cena opakowania zamiast dopłaty, biały tekst na nagłówku (kontrast), interfejs bez biblioteki komponentów |
