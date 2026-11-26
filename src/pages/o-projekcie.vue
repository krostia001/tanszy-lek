<script setup lang="ts">
// Written in the structure of a medicine leaflet ("ulotka"), the document everyone finds in the box.
useSeoMeta({
  title: 'O projekcie',
  description: 'Skąd pochodzą dane, jak wybieramy odpowiedniki leków i jakie są ograniczenia serwisu TańszyLek.',
})

const { sources } = useSources()
const { public: { repoUrl } } = useRuntimeConfig()
</script>

<template>
  <article class="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
    <header class="border-b-4 border-apteka-600 pb-6">
      <h1 class="font-sign text-4xl font-bold sm:text-5xl">
        O projekcie
      </h1>
      <p class="mt-3 text-lg text-toned">
        Ulotka dla użytkownika. Przeczytaj, zanim zaczniesz porównywać leki.
      </p>
    </header>

    <div class="leaflet mt-8 space-y-10 text-lg leading-relaxed">
      <section>
        <h2>1. Czym jest TańszyLek i w jakim celu się go stosuje</h2>
        <p>
          TańszyLek to bezpłatna wyszukiwarka odpowiedników leków. Po wpisaniu nazwy leku pokazuje inne leki z tą samą substancją czynną, dawką i postacią oraz porównuje ich ceny.
        </p>
        <p>
          Ten sam lek bywa sprzedawany pod wieloma nazwami, a różnica w cenie jednego opakowania potrafi wynosić kilkanaście złotych. Przy lekach przyjmowanych codziennie przez lata to realne pieniądze.
        </p>
      </section>

      <section>
        <h2>2. Informacje ważne przed zastosowaniem</h2>
        <ul>
          <li>Serwis ma charakter informacyjny i nie zastępuje porady lekarza ani farmaceuty.</li>
          <li>Odpowiedniki mają tę samą substancję czynną, dawkę i postać, ale mogą różnić się substancjami pomocniczymi, np. laktozą. Jeśli masz alergię lub nietolerancję, zapytaj farmaceutę.</li>
          <li>Ceny znamy dla leków z wykazu Ministerstwa Zdrowia. Ceny pozostałych leków ustala apteka, więc ich nie pokazujemy.</li>
          <li>Jeśli lekarz wpisał na recepcie „nie zamieniać” (NZ), farmaceuta nie wyda innego leku.</li>
        </ul>
      </section>

      <section>
        <h2>3. Jak stosować</h2>
        <p>
          Wpisz nazwę leku z recepty lub opakowania i wybierz go z listy. Na stronie leku wybierz wielkość opakowania. Zobaczysz cenę, tańsze odpowiedniki w tym samym opakowaniu, a niżej opakowania innej wielkości, które wychodzą taniej za tabletkę. W aptece poproś o wybrany odpowiednik. Zgodnie z art. 44 ustawy o refundacji farmaceuta ma obowiązek poinformować cię o tańszym leku.
        </p>
        <p>
          <strong>Skąd ceny.</strong> Pokazujemy ceny urzędowe opakowań z wykazu Ministerstwa Zdrowia. Zmieniają się z każdym nowym obwieszczeniem.
        </p>
      </section>

      <section>
        <h2>4. Skąd pochodzą dane</h2>
        <ul>
          <li
            v-for="source in sources"
            :key="source.key"
          >
            <a :href="source.pageUrl">{{ source.name }}</a>, {{ source.publisher }}.
            <template v-if="source.dataDate">
              Stan na {{ formatDate(source.dataDate) }}.
            </template>
            <template v-else-if="source.edition">
              {{ capitalize(source.edition) }}.
            </template>
          </li>
        </ul>
        <p>
          Rejestr Produktów Leczniczych pobieramy przez API portalu dane.gov.pl. Wykaz leków refundowanych Ministerstwo Zdrowia publikuje jako załącznik do obwieszczenia, zwykle co dwa lub trzy miesiące. Skrypt w repozytorium pobiera oba źródła i buduje z nich bazę danych od zera, więc każdy może sprawdzić wynik.
        </p>
      </section>

      <section>
        <h2>5. Jak wybieramy odpowiedniki</h2>
        <p>
          Dwa leki uznajemy za odpowiedniki, gdy mają tę samą substancję czynną (nazwę międzynarodową), tę samą dawkę, tę samą drogę podania i postać, która nie ma znaczenia klinicznego. Tabletki, tabletki powlekane i kapsułki traktujemy jako tę samą postać. Tabletki o przedłużonym uwalnianiu, plastry czy syropy porównujemy tylko z taką samą postacią.
        </p>
        <p>
          Opakowania tej samej wielkości porównujemy po cenie opakowania, a opakowania innej wielkości po cenie za tabletkę lub kapsułkę. Dla syropów, zastrzyków i inhalatorów porównujemy tylko opakowania tej samej wielkości.
        </p>
        <p>
          Pomijamy leki weterynaryjne, leki z wygasłym pozwoleniem i opakowania skreślone z rejestru.
        </p>
      </section>

      <section>
        <h2>6. Kod źródłowy</h2>
        <p>
          TańszyLek to projekt open source na licencji MIT.
          <template v-if="repoUrl">
            Kod, dokumentacja i instrukcja uruchomienia są w <a :href="repoUrl">repozytorium</a>.
          </template>
          Błędy w danych lub w działaniu serwisu możesz zgłosić w repozytorium projektu.
        </p>
      </section>
    </div>
  </article>
</template>

<style scoped>
.leaflet h2 {
  font-family: var(--font-sign);
  font-size: 1.6rem;
  font-weight: 700;
  line-height: 1.2;
}

.leaflet p,
.leaflet ul {
  margin-top: 0.75rem;
  max-width: 68ch;
}

.leaflet ul {
  list-style: disc;
  padding-left: 1.25rem;
}

.leaflet li + li {
  margin-top: 0.5rem;
}

.leaflet a {
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 4px;
}
</style>
