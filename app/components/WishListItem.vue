<script setup lang="ts">
import type { Product } from '#types/gql';

const { removeFromWishlist } = useWishlist();
const { product, index = 1 } = defineProps<{ product: Product; index?: number }>();
</script>

<template>
  <div class="relative">
    <ProductCard :node="product" :index="index" />
    <button
      v-if="product.databaseId"
      type="button"
      class="remove-wish"
      :title="$t('shop.wishlistRemove')"
      :aria-label="$t('shop.wishlistRemove')"
      @click="removeFromWishlist(product.databaseId)">
      <Icon name="ion:heart" size="16" />
    </button>
  </div>
</template>

<style scoped>
.remove-wish {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 20;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  color: #9a3b26;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.remove-wish:hover {
  background-color: var(--color-charcoal);
  border-color: var(--color-charcoal);
  color: var(--color-cream);
}
</style>
