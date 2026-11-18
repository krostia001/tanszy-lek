<script setup lang="ts">
// Search box with suggestions (WAI-ARIA combobox pattern).
// Choosing a suggestion opens the medicine; Enter without a choice opens the results page.

const props = withDefaults(defineProps<{
  size?: 'hero' | 'compact'
  initial?: string
}>(), { size: 'compact', initial: '' })

const id = useId()
const term = ref(props.initial)
const results = ref<SearchResult[]>([])
const open = ref(false)
const active = ref(-1)

let timer: ReturnType<typeof setTimeout> | undefined
let controller: AbortController | undefined

watch(term, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => suggest(value), 150)
})

async function suggest(value: string) {
  const query = value.trim()
  controller?.abort()
  if (query.length < 2) {
    results.value = []
    open.value = false
    return
  }
  controller = new AbortController()
  try {
    const data = await $fetch('/api/szukaj', { query: { q: query, limit: 8 }, signal: controller.signal })
    results.value = data.results
    active.value = -1
    open.value = true
  }
  catch (error) {
    if ((error as Error).name !== 'AbortError') {
      results.value = []
    }
  }
}

function move(step: number) {
  if (!results.value.length) return
  open.value = true
  const last = results.value.length - 1
  active.value = active.value + step > last ? 0 : active.value + step < 0 ? last : active.value + step
}

function close() {
  open.value = false
  active.value = -1
}

async function submit() {
  const chosen = results.value[active.value]
  close()
  if (chosen) {
    return navigateTo(`/lek/${chosen.slug}`)
  }
  const query = term.value.trim()
  if (query.length >= 2) {
    return navigateTo({ path: '/szukaj', query: { q: query } })
  }
}

const hero = computed(() => props.size === 'hero')
const expanded = computed(() => open.value && results.value.length > 0)
</script>

<template>
  <form
    role="search"
    class="relative"
    @submit.prevent="submit"
  >
    <label
      :for="`${id}-input`"
      class="sr-only"
    >Nazwa leku</label>
    <div
      class="flex items-stretch overflow-hidden rounded-md bg-white text-apteka-900 ring-apteka-950/20 focus-within:ring-4"
      :class="hero ? 'shadow-[0_2px_0_0_var(--color-apteka-800)]' : 'ring-1'"
    >
      <UIcon
        name="i-lucide-search"
        class="shrink-0 self-center text-ink-500"
        :class="hero ? 'ms-4 size-6 sm:ms-5 sm:size-7' : 'ms-3 size-5'"
      />
      <input
        :id="`${id}-input`"
        v-model="term"
        type="text"
        role="combobox"
        autocomplete="off"
        spellcheck="false"
        aria-autocomplete="list"
        :aria-expanded="expanded"
        :aria-controls="`${id}-list`"
        :aria-activedescendant="active >= 0 ? `${id}-option-${active}` : undefined"
        placeholder="Atorvasterol 20 mg"
        class="min-w-0 flex-1 bg-transparent placeholder:text-ink-400 focus:outline-none"
        :class="hero ? 'h-16 px-3 text-lg sm:h-[4.5rem] sm:px-4 sm:text-2xl' : 'h-11 px-3 text-base'"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.esc="close"
        @focus="open = results.length > 0"
        @blur="close"
      >
      <button
        type="submit"
        class="shrink-0 bg-apteka-900 font-sign font-bold text-white hover:bg-apteka-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-apteka-300"
        :class="hero ? 'px-4 text-lg sm:px-8 sm:text-xl' : 'px-4 text-base'"
      >
        Szukaj
      </button>
    </div>

    <ul
      v-show="expanded"
      :id="`${id}-list`"
      role="listbox"
      aria-label="Podpowiedzi"
      class="absolute inset-x-0 top-full z-50 mt-2 max-h-[60vh] overflow-auto rounded-md border border-ink-200 bg-white py-1 text-apteka-900 shadow-xl"
    >
      <li
        v-for="(result, index) in results"
        :id="`${id}-option-${index}`"
        :key="result.slug"
        role="option"
        :aria-selected="index === active"
        class="cursor-pointer px-4 py-2.5"
        :class="index === active ? 'bg-apteka-50' : ''"
        @mousedown.prevent="active = index; submit()"
        @mousemove="active = index"
      >
        <span class="block font-medium">{{ nameWithStrength(result.name, result.strength) }}</span>
        <span class="flex flex-wrap gap-x-3 text-sm text-muted">
          <span>{{ result.form }}</span>
          <span
            v-if="result.substitutes > 0"
            class="text-apteka-700"
          >{{ plural(result.substitutes, ['odpowiednik', 'odpowiedniki', 'odpowiedników']) }}</span>
        </span>
      </li>
    </ul>
  </form>
</template>
