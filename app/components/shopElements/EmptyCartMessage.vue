<script setup lang="ts">
const { toggleCart } = useCart();
</script>

<template>
  <div class="flex flex-col items-center justify-center flex-1 mb-20 text-center">
    <Icon name="ion:cart-outline" size="80" style="color: var(--color-sand)" class="mb-5" />
    <div class="mb-2 font-heading text-lg" style="color: var(--color-charcoal)">{{ $t('shop.cartEmpty') }}</div>
    <span class="mb-8 text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 60%, transparent)">{{ $t('shop.addProductsInYourCart') }}</span>
    <NuxtLink to="/products" class="empty-cart-btn" @click="toggleCart(false)">
      {{ $t('shop.browseOurProducts') }}
    </NuxtLink>
  </div>
</template>

<style scoped>
.empty-cart-btn {
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

.empty-cart-btn:hover {
  background-color: transparent;
  color: var(--color-charcoal);
}
</style>
