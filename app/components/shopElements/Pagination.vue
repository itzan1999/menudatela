<script setup lang="ts">
const route = useRoute();
const { productsPerPage } = useHelpers();
const { products } = useProducts();

const currentQuery = computed(() => {
  const params = new URLSearchParams(route.query as Record<string, string>).toString();
  return params ? decodeURIComponent(params) : '';
});

const page = computed(() => Number.parseInt(route.params.pageNumber as string) || 1);
const numberOfPages = computed<number>(() => Math.ceil(products.value.length / productsPerPage || 1));
const categorySlug = computed(() => {
  const slug = route.params.slug ?? route.params.categorySlug;
  return Array.isArray(slug) ? slug[0] : slug;
});

const pageSrc = (pageNumber: number) => {
  const base = categorySlug.value ? `/product-category/${categorySlug.value}/page/${pageNumber}` : `/products/page/${pageNumber}`;
  return currentQuery.value ? `${base}/?${currentQuery.value}` : base;
};

const prevSrc = (pageNumber: number) => pageSrc(Math.max(1, pageNumber - 1));
const nextSrc = (pageNumber: number) => pageSrc(Math.min(numberOfPages.value, pageNumber + 1));
const numberSrc = (pageNumber: number) => pageSrc(pageNumber);
</script>

<template>
  <div class="flex justify-center mt-8 mb-16 col-span-full tabular-nums">
    <!-- Pagination -->
    <nav v-if="numberOfPages && numberOfPages > 1" class="inline-flex items-center gap-1.5" aria-label="Pagination">
      <!-- PREV -->
      <NuxtLink
        :to="prevSrc(page)"
        class="prev"
        :disabled="page == 1"
        :class="{ 'pointer-events-none opacity-30': page == 1 }"
        :aria-disabled="page == 1"
        aria-label="Previous">
        <Icon name="ion:chevron-back-outline" size="16" class="w-4 h-4" />
      </NuxtLink>

      <!-- NUMBERS -->
      <NuxtLink
        v-for="pageNumber in numberOfPages"
        :key="pageNumber"
        :to="numberSrc(pageNumber)"
        :aria-current="pageNumber === page ? 'page' : undefined"
        class="page-number">
        {{ pageNumber }}
      </NuxtLink>

      <!-- NEXT -->
      <NuxtLink
        :to="nextSrc(page)"
        class="next"
        :disabled="page === numberOfPages"
        :class="{ 'pointer-events-none opacity-30': page === numberOfPages }"
        :aria-disabled="page === numberOfPages"
        aria-label="Next">
        <Icon name="ion:chevron-forward-outline" size="16" class="w-4 h-4" />
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
@reference "#tailwind";

.prev,
.next,
.page-number {
  @apply flex h-9 w-9 items-center justify-center border border-[var(--color-sand)] bg-transparent font-sans text-xs tracking-wider text-[var(--color-charcoal)]/70 transition-colors duration-300 hover:border-[var(--color-charcoal)] hover:text-[var(--color-charcoal)];
}

.page-number[aria-current='page'] {
  @apply border-[var(--color-charcoal)] bg-[var(--color-charcoal)] font-medium text-[var(--color-cream)] hover:text-[var(--color-cream)];
}
</style>
