<script setup lang="ts">
// The site header styled as a pharmacy sign. On the home page it is tall and holds the search.
defineProps<{ hero?: boolean }>()

const { rpl, mz } = useSources()
</script>

<template>
  <header class="relative border-b-4 border-apteka-800 bg-apteka-600 text-white">
    <!-- clipped in its own box, so the search suggestions can overflow the header -->
    <div
      v-if="hero"
      class="pointer-events-none absolute inset-0 hidden overflow-hidden xl:block"
    >
      <!-- a lightbox cross: darker frame, lit face that switches on once -->
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
        class="absolute -right-24 top-20 size-[30rem]"
      >
        <path
          d="M8.5 1.5h7v7h7v7h-7v7h-7v-7h-7v-7h7z"
          fill="var(--color-apteka-700)"
        />
        <path
          class="sign-on"
          d="M9.5 2.5h5v7h7v5h-7v7h-5v-7h-7v-5h7z"
          fill="var(--color-apteka-400)"
        />
      </svg>
    </div>

    <div class="relative mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <SignCross class="size-8" />
        <span class="font-sign text-2xl font-bold">TańszyLek</span>
      </NuxtLink>

      <DrugSearch
        v-if="!hero"
        class="order-last w-full sm:order-none sm:w-auto sm:max-w-xl sm:flex-1"
      />

      <nav
        aria-label="Menu"
        class="ms-auto"
      >
        <NuxtLink
          to="/o-projekcie"
          class="rounded-sm font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          O projekcie
        </NuxtLink>
      </nav>
    </div>

    <div
      v-if="hero"
      class="relative mx-auto max-w-5xl px-4 pb-14 pt-8 sm:px-6 sm:pb-20 sm:pt-14"
    >
      <h1 class="max-w-3xl font-sign text-5xl font-bold leading-[0.95] sm:text-7xl">
        Znajdź tańszy odpowiednik leku
      </h1>
      <p class="mt-5 max-w-2xl text-lg text-apteka-50">
        Wpisz nazwę leku z recepty lub opakowania. Pokażemy leki z tą samą substancją i dawką oraz ile kosztuje każdy z nich.
      </p>
      <DrugSearch
        size="hero"
        class="mt-8 max-w-2xl"
      />
      <p
        v-if="rpl?.dataDate && mz"
        class="mt-4 max-w-2xl text-sm text-apteka-100"
      >
        Ceny urzędowe z wykazu Ministerstwa Zdrowia. Rejestr leków: stan na {{ formatDate(rpl.dataDate) }}.
      </p>
    </div>
  </header>
</template>
