<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data, error } = await useFetch<{ product: ProductInfo, packs: Pack[], substitutes: SubstituteOffer[] }>(
  () => `/api/lek/${slug.value}`,
)

if (error.value || !data.value) {
  throw createError({ statusCode: error.value?.statusCode ?? 404, statusMessage: 'Nie znaleziono leku', fatal: true })
}

const { mz } = useSources()
const product = computed(() => data.value!.product)
const packs = computed(() => data.value!.packs)
const title = computed(() => nameWithStrength(product.value.name, product.value.strength))

useSeoMeta({
  title: () => `${title.value}: tańsze odpowiedniki i ceny`,
  description: () => `Odpowiedniki leku ${title.value} z tą samą substancją i dawką oraz ich ceny w aptece.`,
})

// Default package: the first one with a price, otherwise the first one.
const selectedGtin = ref(packs.value.find(pack => pack.price !== null)?.gtin ?? packs.value[0]?.gtin)
const selected = computed(() => packs.value.find(pack => pack.gtin === selectedGtin.value))

const offers = computed(() => {
  const all = data.value!.substitutes
  const samePack = all.filter(offer => offer.packCount === selected.value?.packCount)
  const priced = samePack.filter(offer => offer.price !== null)
  const mine = selected.value?.price ?? null

  const cheaper = mine === null ? priced : priced.filter(offer => offer.price! < mine)
  const notCheaper = mine === null ? [] : priced.filter(offer => offer.price! >= mine)
  const unpriced = uniqueBy(samePack.filter(offer => offer.price === null), offer => offer.name.toLowerCase())
  const otherPacks = uniqueBy(
    all.filter(offer => offer.packCount !== selected.value?.packCount),
    offer => offer.name.toLowerCase(),
  )
  const best = cheaper[0]?.price ?? null
  return { mine, best, cheaper, notCheaper, unpriced, otherPacks, total: all.length }
})

// Long lists are cut to the first few rows until the visitor asks for more.
const SHORT_LIST = 5
const showAllCheaper = ref(false)
watch(selectedGtin, () => (showAllCheaper.value = false))
const cheapest = computed(() => offers.value.cheaper[0])

/** Difference between two prices, rounded to grosze (avoids 10.909999 from float maths). */
function difference(a: number, b: number): number {
  return Math.round((a - b) * 100) / 100
}

const visibleCheaper = computed(() =>
  showAllCheaper.value ? offers.value.cheaper : offers.value.cheaper.slice(0, SHORT_LIST),
)

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((item) => {
    const value = key(item)
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

const facts = computed(() => [
  { label: 'Substancja czynna', value: product.value.inn },
  { label: 'Dawka', value: product.value.strength },
  { label: 'Postać', value: product.value.form },
  { label: 'Droga podania', value: product.value.route?.replaceAll('\n', ', ') },
  { label: 'Podmiot odpowiedzialny', value: product.value.holder },
  { label: 'Kod ATC', value: product.value.atc },
].filter(fact => fact.value))
</script>

<template>
  <article
    v-if="data"
    class="mx-auto max-w-3xl px-4 pt-10 sm:px-6 sm:pt-14"
  >
    <header>
      <h1 class="font-sign text-4xl font-bold leading-tight sm:text-5xl">
        {{ title }}
      </h1>
      <p class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-lg text-toned">
        <span>{{ product.form }}</span>
        <span
          v-if="selected"
          class="rounded-sm bg-ink-100 px-2 py-0.5 text-base"
        >{{ describeCategory(selected.category) }}</span>
        <span
          v-if="product.parallelImport"
          class="rounded-sm bg-ink-100 px-2 py-0.5 text-base"
        >import równoległy</span>
      </p>
    </header>

    <section
      v-if="packs.length"
      aria-labelledby="opakowanie"
      class="mt-8"
    >
      <h2
        id="opakowanie"
        class="text-lg font-semibold"
      >
        Twoje opakowanie
      </h2>
      <div
        class="mt-3 flex flex-wrap gap-2"
        role="radiogroup"
        aria-labelledby="opakowanie"
      >
        <button
          v-for="pack in packs"
          :key="pack.gtin"
          type="button"
          role="radio"
          :aria-checked="pack.gtin === selectedGtin"
          class="rounded-md border-2 px-4 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apteka-600"
          :class="pack.gtin === selectedGtin ? 'border-apteka-600 bg-apteka-50 font-semibold' : 'border-ink-200 hover:border-ink-400'"
          @click="selectedGtin = pack.gtin"
        >
          {{ pack.size }}
        </button>
      </div>

      <div
        v-if="selected?.price != null"
        class="mt-6 rounded-md bg-apteka-50 p-5 sm:p-6"
      >
        <p class="text-toned">
          Cena opakowania
        </p>
        <p class="font-sign text-5xl font-bold tabular-nums sm:text-6xl">
          {{ formatPln(selected.price) }}
        </p>
        <p
          v-if="mz?.edition"
          class="mt-2 text-sm text-toned"
        >
          Cena urzędowa z wykazu Ministerstwa Zdrowia ({{ mz.edition }}).
        </p>
      </div>
      <p
        v-else-if="selected"
        class="mt-6 rounded-md bg-ink-50 p-5 text-toned"
      >
        Ceny tego opakowania nie ma w wykazie Ministerstwa Zdrowia. Ustala ją apteka.
      </p>
    </section>

    <section
      aria-labelledby="odpowiedniki"
      class="mt-12"
    >
      <h2
        id="odpowiedniki"
        class="font-sign text-3xl font-bold sm:text-4xl"
      >
        {{ offers.mine === null ? 'Odpowiedniki' : 'Tańsze odpowiedniki' }}
      </h2>
      <p
        v-if="selected && offers.total"
        class="mt-2 text-muted"
      >
        Ta sama substancja czynna, dawka i postać, opakowanie {{ sentenceEnd(selected.size) }}
      </p>

      <template v-if="offers.cheaper.length">
        <p
          v-if="offers.mine !== null && cheapest"
          class="mt-5 text-lg"
        >
          Najtańszy odpowiednik to <strong>{{ nameWithStrength(cheapest.name, cheapest.strength) }}</strong>:
          <strong class="tabular-nums">{{ formatPln(cheapest.price!) }}</strong>
          zamiast <span class="tabular-nums">{{ formatPln(offers.mine) }}</span>,
          czyli <strong class="tabular-nums text-apteka-700">{{ formatPln(difference(offers.mine, cheapest.price!)) }} taniej</strong> za każde opakowanie.
        </p>
        <ul class="mt-5 divide-y divide-ink-200 border-y border-ink-200">
          <li
            v-for="offer in visibleCheaper"
            :key="`${offer.slug}-${offer.size}`"
            class="grid grid-cols-[1fr_auto] items-center gap-x-6 py-4"
            :class="offer.price === offers.best ? '-mx-4 bg-apteka-50 px-4 sm:-mx-5 sm:px-5' : ''"
          >
            <div>
              <NuxtLink
                :to="`/lek/${offer.slug}`"
                class="text-lg font-semibold underline-offset-4 hover:underline"
              >{{ nameWithStrength(offer.name, offer.strength) }}</NuxtLink>
              <span class="block text-sm text-muted">
                {{ offer.size }}<template v-if="offer.holder">, {{ offer.holder }}</template><template v-if="offer.parallelImport">, import równoległy</template>
              </span>
            </div>
            <div class="text-right tabular-nums">
              <span class="block text-2xl font-bold">{{ formatPln(offer.price!) }}</span>
              <span
                v-if="offers.mine !== null"
                class="text-sm font-semibold text-apteka-700"
              >taniej o {{ formatPln(difference(offers.mine, offer.price!)) }}</span>
            </div>
          </li>
        </ul>
        <button
          v-if="offers.cheaper.length > SHORT_LIST && !showAllCheaper"
          type="button"
          class="mt-4 rounded-md border-2 border-apteka-600 bg-white px-5 py-2.5 font-semibold text-apteka-900 hover:bg-apteka-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-apteka-600"
          @click="showAllCheaper = true"
        >
          Pokaż wszystkie tańsze odpowiedniki ({{ offers.cheaper.length }})
        </button>
      </template>
      <p
        v-else-if="offers.mine !== null"
        class="mt-5 rounded-md bg-apteka-50 p-5"
      >
        <strong>To najtańszy lek</strong> spośród odpowiedników w tym opakowaniu.
      </p>
      <p
        v-else-if="!offers.total"
        class="mt-5 rounded-md bg-ink-50 p-5 text-toned"
      >
        W rejestrze nie ma innych leków z tą samą substancją, dawką i postacią.
      </p>
      <p
        v-else
        class="mt-5 rounded-md bg-ink-50 p-5 text-toned"
      >
        Żaden odpowiednik w tym opakowaniu nie ma ceny w wykazie Ministerstwa Zdrowia. Ich ceny ustala apteka, więc porównaj je na miejscu.
      </p>

      <details
        v-if="offers.notCheaper.length"
        class="mt-6"
      >
        <summary class="cursor-pointer font-medium">
          Odpowiedniki w tej samej lub wyższej cenie ({{ offers.notCheaper.length }})
        </summary>
        <ul class="mt-3 divide-y divide-ink-200 border-y border-ink-200">
          <li
            v-for="offer in offers.notCheaper"
            :key="`${offer.slug}-${offer.size}`"
            class="flex justify-between gap-6 py-3"
          >
            <NuxtLink
              :to="`/lek/${offer.slug}`"
              class="underline-offset-4 hover:underline"
            >{{ nameWithStrength(offer.name, offer.strength) }}</NuxtLink>
            <span class="tabular-nums">{{ formatPln(offer.price!) }}</span>
          </li>
        </ul>
      </details>

      <details
        v-if="offers.unpriced.length"
        class="mt-4"
        :open="offers.mine === null && !offers.cheaper.length"
      >
        <summary class="cursor-pointer font-medium">
          Odpowiedniki bez ceny w wykazie ({{ offers.unpriced.length }})
        </summary>
        <p class="mt-2 text-sm text-muted">
          Nie ma ich ceny w wykazie Ministerstwa Zdrowia, więc ustala ją apteka.
        </p>
        <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <li
            v-for="offer in offers.unpriced"
            :key="offer.slug"
          >
            <NuxtLink
              :to="`/lek/${offer.slug}`"
              class="underline underline-offset-4"
            >{{ nameWithStrength(offer.name, offer.strength) }}</NuxtLink>
          </li>
        </ul>
      </details>

      <details
        v-if="offers.otherPacks.length"
        class="mt-4"
      >
        <summary class="cursor-pointer font-medium">
          Odpowiedniki w innych opakowaniach ({{ offers.otherPacks.length }})
        </summary>
        <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <li
            v-for="offer in offers.otherPacks"
            :key="offer.slug"
          >
            <NuxtLink
              :to="`/lek/${offer.slug}`"
              class="underline underline-offset-4"
            >{{ nameWithStrength(offer.name, offer.strength) }}</NuxtLink>
          </li>
        </ul>
      </details>
    </section>

    <aside class="mt-12 border-l-4 border-apteka-600 py-1 pl-5">
      <p class="font-semibold">
        W aptece możesz poprosić o tańszy odpowiednik
      </p>
      <p class="mt-1 text-toned">
        Farmaceuta ma obowiązek poinformować cię o tańszym leku z tą samą substancją, dawką i postacią, chyba że lekarz wpisał na recepcie „nie zamieniać” (art. 44 ustawy o refundacji).
      </p>
    </aside>

    <section
      aria-labelledby="informacje"
      class="mt-12"
    >
      <h2
        id="informacje"
        class="font-sign text-2xl font-bold"
      >
        Informacje o leku
      </h2>
      <dl class="mt-4 grid grid-cols-2 gap-x-8 gap-y-4 border-y border-ink-200 py-5">
        <div
          v-for="fact in facts"
          :key="fact.label"
        >
          <dt class="text-sm text-muted">
            {{ fact.label }}
          </dt>
          <dd class="font-medium break-words">
            {{ fact.value }}
          </dd>
        </div>
      </dl>
    </section>

    <section
      v-if="product.leafletUrl || product.spcUrl"
      aria-labelledby="dokumenty"
      class="mt-10"
    >
      <h2
        id="dokumenty"
        class="font-sign text-2xl font-bold"
      >
        Dokumenty leku
      </h2>
      <ul class="mt-3 space-y-2">
        <li v-if="product.leafletUrl">
          <a
            :href="product.leafletUrl"
            class="inline-flex items-center gap-2 font-medium underline underline-offset-4"
          >
            <UIcon
              name="i-lucide-file-text"
              class="size-5"
            />
            Ulotka dla pacjenta (PDF)
          </a>
        </li>
        <li v-if="product.spcUrl">
          <a
            :href="product.spcUrl"
            class="inline-flex items-center gap-2 font-medium underline underline-offset-4"
          >
            <UIcon
              name="i-lucide-file-text"
              class="size-5"
            />
            Charakterystyka produktu leczniczego (PDF)
          </a>
        </li>
      </ul>
    </section>
  </article>
</template>
