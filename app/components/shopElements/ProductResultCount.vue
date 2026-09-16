<script setup lang="ts">
const route = useRoute();
const { products } = useProducts();
const { productsPerPage } = useHelpers();
const page = computed(() => Number.parseInt(route.params.pageNumber as string) || 1);
</script>

<template>
  <div v-if="products.length !== 0" class="font-serif text-xs tracking-wider uppercase text-[var(--color-charcoal)]/70">
    <span>{{ $t('shop.productResultCount.showing') + ' ' }}</span>
    <span class="font-semibold text-[var(--color-charcoal)]">{{ (page - 1) * productsPerPage + 1 }}</span>
    <span>{{ ' ' + $t('shop.productResultCount.to') + ' ' }}</span>
    <span class="font-semibold text-[var(--color-charcoal)]">{{ Math.min(page * productsPerPage, products.length) }}</span>
    <span class="ml-1 opacity-75">
      ({{ $t('shop.productResultCount.of') }} <span class="font-semibold text-[var(--color-charcoal)]">{{ products.length }}</span
      >)
    </span>
  </div>
</template>
