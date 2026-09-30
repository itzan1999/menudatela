<script setup lang="ts">
import type { ProductCategory } from '#types/gql';

const { toggleCategories } = useCategoriesDrawer();
const { data, status } = await useAsyncGql('getProductCategories');
const productCategories = computed<ProductCategory[]>(() => (data.value?.productCategories?.nodes as ProductCategory[]) || []);

// Same `?filter=category[slug]` query the /products sidebar's own category checkboxes already
// write (see useFiltering.ts) — the destination page reads it via route.query, so it "just
// works" without needing to know it came from this drawer rather than that sidebar.
const categoryLink = (slug?: string | null): string => `/products?filter=category[${slug || ''}]`;
</script>

<template>
  <div class="fixed top-0 bottom-0 right-0 z-50 flex flex-col w-11/12 max-w-lg overflow-x-hidden categories-drawer">
    <Icon
      name="ion:close-outline"
      class="absolute p-1 rounded-lg top-6 left-6 md:left-8 cursor-pointer close-icon"
      size="34"
      @click="toggleCategories(false)" />

    <div class="mt-8 text-center drawer-title">{{ $t('shop.category', 2) }}</div>

    <div class="flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
      <div v-if="status === 'pending'" class="flex flex-1 items-center justify-center">
        <LoadingIcon />
      </div>
      <ul v-else-if="productCategories.length" class="category-list">
        <li v-for="category in productCategories" :key="category.id">
          <NuxtLink :to="categoryLink(category.slug)" class="category-row" @click="toggleCategories(false)">
            <span class="category-row-name" v-html="category.name"></span>
            <span v-if="category.count" class="category-row-count">{{ $t('shop.productsCount', category.count) }}</span>
          </NuxtLink>
        </li>
      </ul>
      <div v-else class="flex flex-1 items-center justify-center text-sm text-center empty-message">
        {{ $t('shop.noCategories') }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-drawer {
  background-color: var(--color-cream);
  box-shadow: -10px 0 30px -10px rgba(0, 0, 0, 0.15);
}

.close-icon {
  color: var(--color-charcoal);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.close-icon:hover {
  opacity: 1;
  background-color: var(--color-sand);
}

.drawer-title {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-charcoal);
}

.empty-message {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.category-list > li + li {
  border-top: 1px solid var(--color-sand);
}

.category-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.125rem 0.25rem;
  padding-right: 0.75rem;
  transition:
    background-color 0.2s ease,
    padding-left 0.2s ease;
}

.category-row:hover {
  background-color: var(--color-charcoal);
  padding-left: 0.75rem;
}

.category-row-name {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  letter-spacing: 0.01em;
  color: var(--color-charcoal);
  transition: color 0.2s ease;
}

.category-row-count {
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  white-space: nowrap;
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
  transition: color 0.2s ease;
}

.category-row:hover .category-row-name {
  color: var(--color-cream);
}

.category-row:hover .category-row-count {
  color: color-mix(in oklab, var(--color-cream) 70%, transparent);
}
</style>
