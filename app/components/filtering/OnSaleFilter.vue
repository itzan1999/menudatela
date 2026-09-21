<script setup>
const { getFilter, setFilter, isFiltersActive } = useFiltering();
const selectedTerms = ref(getFilter('sale') || []);

watch(isFiltersActive, () => {
  if (!isFiltersActive.value) selectedTerms.value = [];
});

const toggleSale = () => {
  if (selectedTerms.value.length === 0) {
    selectedTerms.value = ['true'];
    setFilter('sale', ['true']);
  } else {
    selectedTerms.value = [];
    setFilter('sale', []);
  }
};
</script>

<template>
  <div class="py-5">
    <button
      type="button"
      class="flex w-full items-center justify-between border px-3 py-2 font-sans text-xs tracking-wider uppercase transition-all duration-200"
      :class="
        selectedTerms.length > 0
          ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-cream)]'
          : 'border-[var(--color-sand)] bg-transparent text-[var(--color-charcoal)]/80 hover:border-[var(--color-charcoal)]'
      "
      @click="toggleSale">
      <span>{{ $t('shop.onlyOnSale') }}</span>
      <span v-if="selectedTerms.length > 0">✓</span>
    </button>
  </div>
</template>
