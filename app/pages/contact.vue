<script setup lang="ts">
const CONTACT_EMAIL = 'dev@c3i.es';
const { t } = useI18n();

useSeoMeta({
  title: () => t('general.contact'),
});
</script>

<template>
  <main class="container my-16 flex justify-center">
    <div class="contact-card">
      <h1 class="heading-serif-lg">{{ $t('general.contact') }}</h1>
      <p class="contact-text">{{ $t('contact.intro') }}</p>
      <Button :href="`mailto:${CONTACT_EMAIL}`" variant="outline-charcoal" class="tracking-wider uppercase text-xs font-medium">
        {{ CONTACT_EMAIL }}
      </Button>
    </div>
  </main>
</template>

<style scoped>
.contact-card {
  width: 100%;
  max-width: 28rem;
  padding: 2.5rem 2rem;
  text-align: center;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.contact-text {
  margin: 1.25rem 0 2rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
}
</style>
