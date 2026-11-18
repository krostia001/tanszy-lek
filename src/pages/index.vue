<script setup lang="ts">
definePageMeta({ hero: true })
useSeoMeta({ title: 'Znajdź tańszy odpowiednik leku' })

const { data: examples } = await useFetch<Example[]>('/api/przyklady', { default: () => [] })

const steps = [
  {
    title: 'Wpisz nazwę leku',
    text: 'Tak jak na recepcie albo na opakowaniu. Wystarczy kilka pierwszych liter.',
  },
  {
    title: 'Porównaj ceny',
    text: 'Zobaczysz leki z tą samą substancją czynną, dawką i postacią oraz ile kosztuje każdy z nich.',
  },
  {
    title: 'Zapytaj w aptece',
    text: 'Farmaceuta ma obowiązek poinformować o tańszym odpowiedniku, chyba że lekarz wpisał na recepcie „nie zamieniać”.',
  },
]
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 sm:px-6">
    <section
      v-if="examples.length"
      aria-labelledby="przyklady"
      class="pt-14"
    >
      <h2
        id="przyklady"
        class="font-sign text-3xl font-bold sm:text-4xl"
      >
        Tyle można zaoszczędzić na jednym opakowaniu
      </h2>
      <p class="mt-2 max-w-2xl text-muted">
        Cena popularnego leku i jego najtańszego odpowiednika w tym samym opakowaniu. Ceny urzędowe z aktualnego wykazu Ministerstwa Zdrowia.
      </p>

      <ul class="mt-6 divide-y divide-ink-200 border-y border-ink-200">
        <li
          v-for="example in examples"
          :key="example.slug"
        >
          <NuxtLink
            :to="`/lek/${example.slug}`"
            class="group grid grid-cols-[1fr_auto] items-center gap-x-6 py-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apteka-600"
          >
            <span>
              <span class="text-lg font-semibold underline-offset-4 group-hover:underline">{{ nameWithStrength(example.name, example.strength) }}</span>
              <span class="block text-muted">{{ example.size }}</span>
            </span>
            <span class="text-right tabular-nums">
              <span class="block">
                <span class="sr-only">Zamiast </span>
                <s class="text-muted">{{ formatPln(example.price) }}</s>
                <span class="sr-only">odpowiednik kosztuje </span>
                <span class="ms-2 text-2xl font-bold text-apteka-700">{{ formatPln(example.bestPrice) }}</span>
              </span>
              <span class="text-sm font-medium text-apteka-700">taniej o {{ formatPln(example.saving) }}</span>
            </span>
          </NuxtLink>
        </li>
      </ul>
    </section>

    <section
      aria-labelledby="jak-to-dziala"
      class="pt-16"
    >
      <h2
        id="jak-to-dziala"
        class="font-sign text-3xl font-bold sm:text-4xl"
      >
        Jak to działa
      </h2>
      <ol class="mt-8 grid gap-10 sm:grid-cols-3 sm:gap-8">
        <li
          v-for="(step, index) in steps"
          :key="step.title"
          class="border-t-4 border-apteka-600 pt-4"
        >
          <span
            class="font-sign text-5xl font-bold leading-none text-apteka-600"
            aria-hidden="true"
          >{{ index + 1 }}</span>
          <h3 class="mt-3 text-xl font-semibold">
            {{ step.title }}
          </h3>
          <p class="mt-2 text-muted">
            {{ step.text }}
          </p>
        </li>
      </ol>
    </section>
  </div>
</template>
