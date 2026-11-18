<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)
useSeoMeta({ title: () => (notFound.value ? 'Nie znaleziono strony' : 'Błąd serwisu') })
</script>

<template>
  <UApp>
    <NuxtLayout>
      <div class="mx-auto max-w-3xl px-4 pt-14 sm:px-6">
        <h1 class="font-sign text-4xl font-bold sm:text-5xl">
          {{ notFound ? 'Nie znaleźliśmy tej strony' : 'Serwis chwilowo nie działa' }}
        </h1>
        <p class="mt-3 text-lg text-toned">
          {{ notFound
            ? 'Lek mógł zostać usunięty z rejestru albo adres jest niepełny. Wyszukaj lek jeszcze raz.'
            : 'Spróbuj ponownie za chwilę. Jeśli błąd się powtarza, zgłoś go w repozytorium projektu.' }}
        </p>
        <DrugSearch class="mt-8" />
      </div>
    </NuxtLayout>
  </UApp>
</template>
