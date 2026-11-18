<script setup lang="ts">
const route = useRoute()
const query = computed(() => String(route.query.q ?? '').trim())

const { data } = await useFetch<{ query: string, results: SearchResult[], fuzzy: boolean }>('/api/szukaj', {
  query: { q: query, limit: 50 },
})

useSeoMeta({ title: () => (query.value ? `Wyniki dla „${query.value}”` : 'Wyszukiwanie') })
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14">
    <h1 class="font-sign text-4xl font-bold sm:text-5xl">
      <template v-if="query">
        Wyniki dla „{{ query }}”
      </template>
      <template v-else>
        Wyszukiwanie
      </template>
    </h1>

    <template v-if="data?.results.length">
      <p
        v-if="data.fuzzy"
        class="mt-3 text-toned"
      >
        Nie znaleźliśmy dokładnie tej nazwy. Podobne nazwy leków:
      </p>
      <ul class="mt-6 divide-y divide-ink-200 border-y border-ink-200">
        <li
          v-for="result in data.results"
          :key="result.slug"
        >
          <NuxtLink
            :to="`/lek/${result.slug}`"
            class="group block py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apteka-600"
          >
            <span class="text-lg font-semibold underline-offset-4 group-hover:underline">{{ nameWithStrength(result.name, result.strength) }}</span>
            <span class="mt-0.5 flex flex-wrap gap-x-4 text-muted">
              <span>{{ result.form }}</span>
              <span
                v-if="result.substitutes > 0"
                class="text-apteka-700"
              >{{ plural(result.substitutes, ['odpowiednik', 'odpowiedniki', 'odpowiedników']) }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </template>

    <div
      v-else
      class="mt-6 max-w-2xl"
    >
      <p
        v-if="query.length >= 2"
        class="text-lg"
      >
        Nie znaleźliśmy leku o nazwie „{{ query }}”.
      </p>
      <p class="mt-2 text-toned">
        Sprawdź pisownię albo wpisz nazwę substancji czynnej po łacinie, np. Atorvastatinum. Wyszukiwarka zna leki dopuszczone do obrotu w Polsce.
      </p>
      <DrugSearch
        :initial="query"
        class="mt-6"
      />
    </div>
  </div>
</template>
