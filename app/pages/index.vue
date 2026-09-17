<script lang="ts" setup>
import { ProductsOrderByEnum } from '#gql/default';
const { siteName, description, shortDescription, siteImage } = useAppConfig();

const [{ data }, { data: productData }] = await Promise.all([
  useAsyncGql('getProductCategories', { first: 6 }),
  useAsyncGql('getProducts', { first: 5, orderby: ProductsOrderByEnum.Popularity }),
]);

const productCategories = data.value?.productCategories?.nodes || [];
const popularProducts = productData.value?.products?.nodes || [];

useSeoMeta({
  title: `Home`,
  ogTitle: siteName,
  description: description,
  ogDescription: shortDescription,
  ogImage: siteImage,
  twitterCard: `summary_large_image`,
});
</script>

<template>
  <main>
    <HeroBanner />

    <section class="trust-bar">
      <div class="container trust-bar-grid">
        <div class="trust-item">
          <Icon name="ion:leaf-outline" size="20" />
          <span>100% algodón y lino</span>
        </div>
        <div class="trust-item">
          <Icon name="ion:cube-outline" size="20" />
          <span>Envíos en 24-48h</span>
        </div>
        <div class="trust-item">
          <Icon name="ion:refresh-outline" size="20" />
          <span>Devolución gratuita</span>
        </div>
        <div class="trust-item">
          <Icon name="ion:lock-closed-outline" size="20" />
          <span>Pago 100% seguro</span>
        </div>
      </div>
    </section>

    <section class="container my-16">
      <div class="flex items-end justify-between">
        <h2 class="font-heading text-xl md:text-2xl" style="color: var(--color-charcoal)">{{ $t('shop.shopByCategory') }}</h2>
        <NuxtLink class="section-link" to="/categories">{{ $t('general.viewAll') }}</NuxtLink>
      </div>
      <div class="grid justify-center grid-cols-2 gap-4 mt-8 md:grid-cols-3 lg:grid-cols-6">
        <CategoryCard v-for="(category, i) in productCategories" :key="i" class="w-full" :node="category" />
      </div>
    </section>

    <section v-if="popularProducts" class="container my-16">
      <div class="flex items-end justify-between">
        <h2 class="font-heading text-xl md:text-2xl" style="color: var(--color-charcoal)">{{ $t('shop.popularProducts') }}</h2>
        <NuxtLink class="section-link" to="/products">{{ $t('general.viewAll') }}</NuxtLink>
      </div>
      <ProductRow :products="popularProducts" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5 mt-8" />
    </section>
  </main>
</template>

<style scoped>
.section-link {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  padding-bottom: 0.125rem;
  border-bottom: 1px solid color-mix(in oklab, var(--color-charcoal) 40%, transparent);
  transition: border-color 0.2s ease;
}

.section-link:hover {
  border-color: var(--color-charcoal);
}
</style>

<style scoped>
.trust-bar {
  border-bottom: 1px solid var(--color-sand);
  background-color: color-mix(in oklab, var(--color-cream) 60%, white);
}

.trust-bar-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem 1rem;
  padding: 1.75rem 0;
}

@media (min-width: 768px) {
  .trust-bar-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
}

.trust-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  opacity: 0.85;
  text-align: center;
}

@media (min-width: 768px) {
  .trust-item:not(:last-child) {
    border-right: 1px solid var(--color-sand);
  }
}
</style>
