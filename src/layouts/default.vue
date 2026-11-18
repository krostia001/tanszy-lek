<script setup lang="ts">
const route = useRoute()
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <a
      href="#tresc"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-apteka-900"
    >Przejdź do treści</a>
    <AppSign :hero="route.meta.hero === true" />
    <main
      id="tresc"
      class="flex-1"
    >
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
