<script setup lang="ts">
const { allProducts } = useProducts();
const { clearSearchQuery } = useSearching();
const { resetFilter } = useFiltering();

const clearAll = async () => {
  await resetFilter();
  clearSearchQuery();
};
</script>

<template>
  <div class="w-full my-16 lg:my-24">
    <div class="flex flex-col items-center justify-center w-full text-center text-pretty">
      <Icon name="ion:search-outline" size="72" class="mb-8" style="color: var(--color-sand)" />
      <h2 class="font-heading text-xl md:text-2xl" style="color: var(--color-charcoal)">{{ $t('shop.noProductsFound.title') }}</h2>
      <p class="mt-4 max-w-md" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
        <slot>{{ $t('shop.noProductsFound.subText') }}</slot>
      </p>
      <button v-if="allProducts.length" class="clear-filters-btn mt-8" @click="clearAll">
        {{ $t('shop.noProductsFound.clearFiltersAndSearch') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.clear-filters-btn {
  padding: 0.75rem 1.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  background-color: transparent;
  border: 1px solid var(--color-charcoal);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.clear-filters-btn:hover {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}
</style>
