<script setup lang="ts">
const { sources } = useSources()
const { public: { repoUrl } } = useRuntimeConfig()
</script>

<template>
  <footer class="mt-24 border-t-4 border-apteka-600 bg-ink-50">
    <div class="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:grid-cols-[1.2fr_1fr] sm:px-6">
      <div>
        <p class="flex items-center gap-2 font-sign text-xl font-bold">
          <SignCross class="size-5 text-apteka-600" />
          TańszyLek
        </p>
        <p class="mt-3 max-w-md text-muted">
          Serwis ma charakter informacyjny i nie zastępuje porady lekarza ani farmaceuty. Zanim zmienisz lek, porozmawiaj z lekarzem lub farmaceutą.
        </p>
        <p class="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          <NuxtLink
            to="/o-projekcie"
            class="font-medium underline underline-offset-4"
          >O projekcie</NuxtLink>
          <a
            v-if="repoUrl"
            :href="repoUrl"
            class="font-medium underline underline-offset-4"
          >Kod źródłowy (MIT)</a>
        </p>
      </div>

      <div>
        <h2 class="font-sign text-lg font-bold">
          Źródła danych
        </h2>
        <ul class="mt-3 space-y-3">
          <li
            v-for="source in sources"
            :key="source.key"
          >
            <a
              :href="source.pageUrl"
              class="font-medium underline underline-offset-4"
            >{{ source.name }}</a>
            <span class="block text-sm text-muted">
              {{ source.publisher }}<template v-if="source.dataDate">, stan na {{ formatDate(source.dataDate) }}</template><template v-else-if="source.edition">, {{ source.edition }}</template>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
