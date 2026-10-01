<script setup lang="ts">
const { theList } = useWishlist();

const { page: wishlistPage, totalPages: wishlistTotalPages, paged: wishlistPaged } = usePagination(theList, 20);
</script>

<template>
  <div class="wishlist-page container my-12">
    <div class="mb-10 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--color-sand)] pb-6">
      <h1 class="font-heading text-2xl md:text-3xl" style="color: var(--color-charcoal)">{{ $t('shop.wishlist') }}</h1>
      <span v-if="theList.length" class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">
        {{ $t('shop.productsCount', theList.length) }}
      </span>
    </div>

    <client-only>
      <template v-if="theList.length">
        <div class="wishlist-grid grid grid-cols-2 gap-8">
          <WishListItem v-for="(product, i) in wishlistPaged" :key="product.databaseId" :product="product" :index="i" />
        </div>
        <SimplePagination :page="wishlistPage" :total-pages="wishlistTotalPages" @update:page="wishlistPage = $event" />
      </template>
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="ion:heart-outline" size="80" style="color: var(--color-sand)" class="mb-5" />
        <p class="mb-8 text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 60%, transparent)">{{ $t('shop.wishlistNoItems') }}</p>
        <NuxtLink to="/products" class="browse-btn">{{ $t('shop.browseOurProducts') }}</NuxtLink>
      </div>
    </client-only>
  </div>
</template>

<style scoped>
@reference "#tailwind";

/* The standalone /wishlist page gives this its full width, but the same component is also
   embedded next to the account sidebar in /my-account, where it only gets whatever's left after
   that sidebar — a much narrower box despite the viewport itself being wide. Sizing the grid off
   *this element's own* width (container queries) rather than the viewport is what keeps the
   card count sane in the cramped account-page context instead of cramming in as many columns as
   a full-width page would get at that screen size. */
.wishlist-page {
  container-type: inline-size;
}

@container (min-width: 36rem) {
  .wishlist-grid {
    @apply grid-cols-3;
  }
}

@container (min-width: 50rem) {
  .wishlist-grid {
    @apply grid-cols-4;
  }
}

@container (min-width: 68rem) {
  .wishlist-grid {
    @apply grid-cols-5;
  }
}

.browse-btn {
  padding: 0.75rem 1.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-cream);
  background-color: var(--color-charcoal);
  border: 1px solid var(--color-charcoal);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.browse-btn:hover {
  background-color: transparent;
  color: var(--color-charcoal);
}
</style>
