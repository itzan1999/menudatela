<script setup lang="ts">
const { siteName } = useAppConfig();
const runtimeConfig = useRuntimeConfig();
const img = useImage();

const logoUrl = runtimeConfig?.public?.LOGO ? img(runtimeConfig?.public?.LOGO) : null;
</script>

<template>
  <NuxtLink to="/" class="inline-flex items-center">
    <img v-if="logoUrl" :src="logoUrl" :alt="$t('general.logo')" class="object-contain h-10" />
    <span v-else class="wordmark">{{ siteName }}</span>
  </NuxtLink>
</template>

<style scoped>
.wordmark {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--color-charcoal);
}
</style>
