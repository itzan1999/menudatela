<script setup lang="ts">
import type { Product } from '#types/gql';

const { setProducts, updateProductList } = useProducts();
const route = useRoute();
const { storeSettings } = useAppConfig();

const { data, error, status } = await useAsyncGql('getProducts');
const allProducts = computed<Product[]>(() => (data.value?.products?.nodes ?? []) as Product[]);
const isLoading = computed<boolean>(() => status.value === 'idle' || status.value === 'pending');
const hasError = computed<boolean>(() => Boolean(error.value));
const hasProducts = computed<boolean>(() => allProducts.value.length > 0);

watchEffect(() => {
  setProducts(allProducts.value);
});

// Aplica el filtro/búsqueda ya en el propio render (servidor y cliente),
// para que el HTML inicial llegue correctamente filtrado y no haya parpadeo.
if (Object.keys(route.query).length > 0) {
  await updateProductList();
}

watch(
  () => route.query,
  () => {
    if (!['products', 'product-page-pager'].includes(String(route.name))) return;
    updateProductList();
  },
);

useHead({
  title: `Products`,
  meta: [{ name: 'description', content: 'Discover our products' }],
});
</script>

<template>
  <main>
    <div v-if="isLoading" class="container flex items-center justify-center min-h-96">
      <LoadingIcon size="32" stroke="3" />
    </div>
    <div v-else-if="hasProducts" class="container flex items-start gap-16">
      <Filters v-if="storeSettings.showFilters" />

      <div class="w-full">
        <div class="flex items-center justify-between w-full gap-4 mt-8 md:gap-8">
          <ProductResultCount />
          <OrderByDropdown v-if="storeSettings.showOrderByDropdown" class="hidden md:inline-flex" />
          <ShowFilterTrigger v-if="storeSettings.showFilters" class="md:hidden" />
        </div>
        <ProductGrid />
      </div>
    </div>
    <NoProductsFound v-else-if="hasError">{{ $t('shop.productsLoadError') }}</NoProductsFound>
    <NoProductsFound v-else>{{ $t('shop.noProductsFound.subText') }}</NoProductsFound>
  </main>
</template>
