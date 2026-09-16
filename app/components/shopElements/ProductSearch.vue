<script setup>
const { getSearchQuery, setSearchQuery, clearSearchQuery } = useSearching();
const searchQuery = ref(getSearchQuery());

const reset = () => {
  clearSearchQuery();
  searchQuery.value = '';
};

watch(
  () => getSearchQuery(),
  (value) => {
    if (!value) reset();
  },
);
</script>

<template>
  <form class="relative items-center flex-1" @submit.prevent="setSearchQuery(searchQuery)">
    <Icon name="ion:search-outline" size="18" class="absolute z-10 opacity-50 pointer-events-none left-1" />
    <input
      id="product-search-input"
      v-model="searchQuery"
      type="text"
      :placeholder="$t('shop.searchProducts')"
      class="search-input" />
    <span
      v-if="searchQuery"
      class="absolute z-10 flex items-center gap-1 px-2 py-1 text-xs cursor-pointer text-charcoal/60 hover:text-charcoal right-1"
      @click="reset">
      <span>{{ $t('general.clear') }}</span>
      <Icon name="ion:close-outline" size="16" />
    </span>
  </form>
</template>

<style scoped>
.search-input {
  width: 100%;
  padding: 0.5rem 0.25rem 0.5rem 1.75rem;
  font-size: 0.8125rem;
  color: var(--color-charcoal);
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--color-sand);
  outline: none;
  transition: border-color 0.2s ease;
}

.search-input::placeholder {
  color: color-mix(in oklab, var(--color-charcoal) 45%, transparent);
}

.search-input:focus {
  border-bottom-color: var(--color-charcoal);
}
</style>
