<script setup lang="ts">
const { t } = useI18n();

useSeoMeta({
  title: () => t('about.title'),
});
</script>

<template>
  <main class="container my-16 max-w-3xl">
    <h1 class="heading-serif-lg mb-8">{{ $t('about.title') }}</h1>

    <div class="about-prose">
      <i18n-t keypath="about.paragraph1" tag="p">
        <template #brand><strong>MenudaTela</strong></template>
      </i18n-t>

      <p>{{ $t('about.paragraph2') }}</p>

      <i18n-t keypath="about.paragraph3" tag="p">
        <template #link><NuxtLink to="/contact">{{ $t('about.contactLinkText') }}</NuxtLink></template>
      </i18n-t>
    </div>
  </main>
</template>

<style scoped>
.about-prose p {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
  margin-bottom: 1.25rem;
}

.about-prose strong {
  color: var(--color-charcoal);
  font-weight: 600;
}

.about-prose a {
  color: var(--color-charcoal);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
