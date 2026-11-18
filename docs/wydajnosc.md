# Wydajność i optymalizacja

| Metryka | |
|---|---|
| Identyfikator | TL-DOC-007 |
| Wersja | 1.0 |
| Status | zatwierdzony |
| Autor | krostia001 |
| Data | 2026-11-18 |

## Cel dokumentu

Pokazuje, jak szybko działa serwis (ładowanie stron i czas odpowiedzi na zapytania), jakie techniki optymalizacji zastosowaliśmy i jak powtórzyć pomiary.

## Jak mierzymy

- **Build produkcyjny** (`bun run build`, serwer `node .output/server/index.mjs`) na laptopie z Windows 11, Node.js 24. Te same wyniki daje kontener z `docker compose up`.
- **Czas odpowiedzi**: [`scripts/benchmark.ts`](../scripts/benchmark.ts). Pierwsze żądanie osobno, potem 200 żądań na adres przy 10 równoległych klientach (p50, p95, żądania na sekundę).
- **Ładowanie strony**: [`scripts/lighthouse.ts`](../scripts/lighthouse.ts), Lighthouse 13.6 w profilu mobilnym, tak jak w PageSpeed Insights: symulowany wolny 4G i 4 razy wolniejszy procesor.

```bash
bun run build && PORT=3000 node .output/server/index.mjs   # w drugim terminalu:
bun run bench
bun run lighthouse
```

## Wyniki: ładowanie strony (Lighthouse, telefon)

| Strona | Wydajność | Dostępność | Dobre praktyki | SEO | FCP | LCP | TBT | CLS | Waga strony |
|---|---|---|---|---|---|---|---|---|---|
| Główna, przed | 98 | 96 | 100 | 100 | 1,8 s | 1,8 s | 40 ms | 0,041 | 753 KiB |
| **Główna, po** | **100** | **100** | **100** | **100** | **0,8 s** | **0,8 s** | **10 ms** | **0** | **217 KiB** |
| Lek, przed | 98 | 100 | 100 | 100 | 1,8 s | 1,8 s | 40 ms | 0 | 782 KiB |
| **Lek, po** | **100** | **100** | **100** | **100** | **0,8 s** | **0,8 s** | **40 ms** | **0** | **223 KiB** |
| O projekcie, przed | 98 | 100 | 100 | 100 | 1,8 s | 1,8 s | 30 ms | 0 | 726 KiB |
| **O projekcie, po** | **100** | **100** | **100** | **100** | **0,8 s** | **0,8 s** | **10 ms** | **0** | **191 KiB** |

## Wyniki: czas odpowiedzi (po optymalizacji)

| Adres | Pierwsze żądanie | p50 | p95 | Żądań/s | Rozmiar odpowiedzi |
|---|---|---|---|---|---|
| Strona główna | 17 ms | 48 ms | 62 ms | 201 | 5,9 kB (br) |
| Strona leku | 10 ms | 58 ms | 73 ms | 167 | 8,1 kB (br) |
| API: wyszukiwanie | 2 ms | 5 ms | 9 ms | 1 822 | 0,2 kB (br) |
| API: lek z odpowiednikami | 1 ms | 10 ms | 19 ms | 925 | 1,4 kB (br) |
| API: przykłady | 0,4 ms | 1 ms | 2 ms | 6 862 | 0,5 kB |

Czasy dla stron to pełne renderowanie HTML na serwerze przy 10 jednoczesnych użytkownikach. Pojedynczy użytkownik dostaje stronę w 10–20 ms.

## Rozmiar plików

| | Przed | Po |
|---|---|---|
| CSS | 192 kB (29 kB gzip) | **21 kB (5 kB gzip)** |
| JavaScript, wszystkie strony | 438 kB (151 kB gzip) | **241 kB (88 kB gzip)** |
| Fonty w buildzie | 32 pliki, 480 kB | **20 plików, 300 kB** |
| HTML strony leku | 34 kB | **8 kB (brotli)** |
| JSON leku z odpowiednikami | 20 kB | **1,4 kB (brotli)** |
| Obraz Dockera | 1,01 GB | **623 MB** |

## Zastosowane techniki

### Dane i zapytania

- **Ciężka praca raz, przy budowaniu bazy.** Czyszczenie danych, łączenie rejestru z cenami, grupowanie odpowiedników i przykłady na stronę główną liczy skrypt `build-db.ts`. Zapytanie z aplikacji to już tylko odczyt gotowych tabel.
- **DuckDB w procesie serwera.** Baza nie stoi na osobnym serwerze, więc nie ma opóźnień sieciowych. Plik jest otwierany raz, tylko do odczytu.
- **Indeksy** na adresie leku, grupie odpowiedników, opakowaniach i kodach GTIN.
- **Indeks wyszukiwania** z nazwami bez polskich znaków i bez duplikatów (jeden wiersz na nazwę, dawkę i postać). Wyszukiwanie z tolerancją literówek uruchamia się tylko wtedy, gdy zwykłe nic nie znalazło.
- **Bufor wyników po stronie serwera** (`defineCachedFunction`): powtórne zapytanie trwa 1–3 ms.

### Przesyłanie

- **Kompresja HTML i JSON** w locie (brotli, a dla starszych przeglądarek gzip). Plugin `src/server/plugins/compression.ts`.
- **Statyczne pliki skompresowane raz przy buildzie** (`nitro.compressPublicAssets`) i buforowane w przeglądarce na rok (nazwy plików zawierają skrót treści).
- **Odpowiedzi API nie są przechowywane przez przeglądarkę** (`cache-control: no-cache`), żeby po aktualizacji danych nikt nie widział starych cen.

### Front-end

- **Bez biblioteki komponentów.** Nuxt UI dodawał 171 kB CSS i ok. 200 kB JavaScriptu (63 kB po kompresji), a używaliśmy z niego tylko dwóch ikon. Ikony są teraz wbudowanymi plikami SVG.
- **Renderowanie po stronie serwera**: treść (ceny, odpowiedniki) jest w HTML od razu, bez czekania na JavaScript.
- **Fonty z własnej domeny**, tylko używane grubości i znaki łacińskie z polskimi. Font nagłówka jest pobierany z wyprzedzeniem (`preload`), a zastępczy font ma dopasowane metryki, więc tekst nie przeskakuje (CLS = 0).
- **Wyszukiwarka z podpowiedziami** czeka 150 ms po ostatnim naciśnięciu klawisza i przerywa poprzednie żądanie, więc nie wysyła zapytania przy każdej literze.

### Docker

- Jedna kopia DuckDB zamiast dwóch: skrypty danych korzystają z bibliotek dołączonych do serwera.
- Uprawnienia ustawiane przy kopiowaniu (`COPY --chown`) zamiast osobnego `chown -R`, który zapisywał każdy plik drugi raz.

## Kompromisy

- **Kompresja kosztuje procesor.** Przy 10 równoległych klientach odpowiedź API z lekiem wydłużyła się z 3 do 10 ms (p50), a przepustowość spadła z ok. 2 300 do ok. 900 żądań/s. W zamian odpowiedź jest 14 razy mniejsza, co na telefonie z wolnym internetem daje znacznie więcej niż kilka milisekund serwera.
- **HTML nie jest buforowany.** Strony są renderowane przy każdym wejściu (ok. 10–20 ms). Bufor HTML przyspieszyłby to do kilku milisekund, ale wymagałby ostrożności z nagłówkami, żeby przeglądarki nie pokazywały starych cen.

## Historia zmian

| Wersja | Data | Autor | Opis zmiany |
|---|---|---|---|
| 1.0 | 2026-11-18 | krostia001 | Pomiary przed i po optymalizacji, opis technik |
