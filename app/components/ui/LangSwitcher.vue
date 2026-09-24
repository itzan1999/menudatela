<script setup>
const { locales, locale, setLocale, setLocaleCookie } = useI18n();

const switchLanguage = async (newLocale) => {
  await setLocale(newLocale);
};

watch(locale, (newLocale) => {
  if (newLocale) {
    setLocaleCookie(newLocale);
  }
});
</script>

<template>
  <select id="language-switcher" :value="locale" :aria-label="$t('account.languageSwitcher')" class="lang-select" @change="switchLanguage($event.target.value)">
    <option v-for="loc in locales" :key="loc.code" :value="loc.code" v-html="loc.name"></option>
  </select>
</template>

<style scoped>
.lang-select {
  appearance: none;
  background-color: transparent;
  border: 1px solid color-mix(in oklab, var(--color-cream) 30%, transparent);
  border-radius: 0.25rem;
  padding: 0.5rem 2rem 0.5rem 0.75rem;
  font-size: 0.8125rem;
  color: var(--color-cream);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 16 16'%3E%3Cpath stroke='%23f7f2ea' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 6l4 4 4-4'/%3E%3C/svg%3E");
  background-position: center right 0.5rem;
  background-repeat: no-repeat;
  background-size: 1rem;
  transition: border-color 0.2s ease;
}

.lang-select:hover,
.lang-select:focus {
  border-color: color-mix(in oklab, var(--color-cream) 60%, transparent);
  outline: none;
}

.lang-select option {
  color: var(--color-charcoal);
  background-color: var(--color-cream);
}
</style>
