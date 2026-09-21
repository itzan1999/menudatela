<script setup lang="ts">
const { theList } = useWishlist();
</script>

<template>
  <div class="wishlist-card min-h-56 w-full p-4 md:p-12 justify-center items-start">
    <div class="container">
      <div class="flex justify-between items-center mb-4">
        <h1 class="font-heading text-xl" style="color: var(--color-charcoal)">{{ $t('shop.wishlist') }}</h1>
        <span class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">Items: {{ theList.length }}</span>
      </div>
      <client-only>
        <ul v-if="theList.length" class="wishlist-list">
          <WishListItem v-for="product in theList" :key="product.databaseId" :product="product" />
        </ul>
        <div v-else class="flex text-center min-h-56 items-center justify-center" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">
          <p>{{ $t('shop.wishlistNoItems') }}</p>
        </div>
      </client-only>
    </div>
  </div>
</template>

<style scoped>
.wishlist-card {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.wishlist-list {
  display: grid;
}

.wishlist-list > :deep(*) {
  border-top: 1px solid var(--color-sand);
}

.wishlist-list > :deep(*:first-child) {
  border-top: none;
}
</style>
