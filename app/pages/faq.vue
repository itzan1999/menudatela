<script setup lang="ts">
const { t, tm } = useI18n();

const FAQS = computed(() => tm('faq.items') as { question: string; answer: string }[]);

const openIndex = ref<number | null>(null);

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index;
};

useSeoMeta({
  title: () => t('faq.title'),
});
</script>

<template>
  <main class="container my-16 max-w-3xl">
    <h1 class="heading-serif-lg mb-8">{{ $t('faq.title') }}</h1>

    <div class="faq-list">
      <div v-for="(faq, index) in FAQS" :key="faq.question" class="faq-item">
        <button type="button" class="faq-question" :aria-expanded="openIndex === index" @click="toggle(index)">
          <span>{{ faq.question }}</span>
          <Icon :name="openIndex === index ? 'ion:remove-outline' : 'ion:add-outline'" size="18" />
        </button>
        <div v-if="openIndex === index" class="faq-answer">
          <p>{{ faq.answer }}</p>
        </div>
      </div>
    </div>

    <i18n-t keypath="faq.footerCta" tag="p" class="faq-footer">
      <template #email><a href="mailto:dev@c3i.es">dev@c3i.es</a></template>
    </i18n-t>
  </main>
</template>

<style scoped>
.faq-list {
  border-top: 1px solid var(--color-sand);
}

.faq-item {
  border-bottom: 1px solid var(--color-sand);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.25rem 0;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-charcoal);
  background-color: transparent;
  cursor: pointer;
}

.faq-question :deep(svg) {
  flex-shrink: 0;
  color: var(--color-charcoal);
}

.faq-answer {
  padding: 0 1.5rem 1.25rem 0;
}

.faq-answer p {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
}

.faq-footer {
  margin-top: 2.5rem;
  font-size: 0.9375rem;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
}

.faq-footer a {
  color: var(--color-charcoal);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
