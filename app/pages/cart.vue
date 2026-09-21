<script setup lang="ts">
const { cart, isCartMutating, refreshCartIfNeeded } = useCart();

onMounted(refreshCartIfNeeded);

definePageMeta({
  title: 'Cart',
});

useSeoMeta({
  title: 'Shopping Cart',
  description: 'View and manage items in your shopping cart',
});
</script>

<template>
  <main class="container my-16 min-h-150 items-center flex flex-col">
    <ClientOnly>
      <div v-if="cart && !cart.isEmpty" class="grid lg:grid-cols-3 gap-8 lg:gap-12 w-full">
        <!-- Cart Items -->
        <div class="lg:col-span-2">
          <ul class="flex flex-col cart-list">
            <li v-for="item in cart.contents?.nodes" :key="item.key">
              <CartCard :item />
            </li>
          </ul>
        </div>

        <!-- Order Summary Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-24 order-summary-card">
            <h2 class="font-heading text-lg mb-4" style="color: var(--color-charcoal)">{{ $t('shop.orderSummary') }}</h2>

            <div class="space-y-3 mb-6 summary-rows">
              <div class="flex justify-between">
                <span>{{ $t('shop.subtotal') }}</span>
                <span class="summary-value tabular-nums" v-html="cart.subtotal"></span>
              </div>

              <div v-if="cart.shippingTotal" class="flex justify-between">
                <span>{{ $t('general.shipping') }}</span>
                <span class="summary-value tabular-nums">
                  {{ Number.parseFloat(cart.shippingTotal) > 0 ? '+' : '' }} <span v-html="cart.shippingTotal"></span>
                </span>
              </div>

              <div v-if="cart.discountTotal && Number.parseFloat(cart.rawDiscountTotal || '0') > 0" class="flex justify-between text-primary">
                <span>{{ $t('shop.discount') }}</span>
                <span class="font-medium tabular-nums">- <span v-html="cart.discountTotal"></span></span>
              </div>

              <div class="summary-total-row flex justify-between items-center">
                <span class="summary-total-label">{{ $t('shop.total') }}</span>
                <span class="summary-total-value tabular-nums" v-html="cart.total"></span>
              </div>
            </div>

            <NuxtLink :to="isCartMutating ? undefined : '/checkout'" class="checkout-btn" :class="{ 'pointer-events-none opacity-50': isCartMutating }">
              {{ isCartMutating ? $t('general.updating') : $t('shop.checkout') }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty Cart Message -->
      <EmptyCartMessage v-else-if="cart && cart.isEmpty" />

      <!-- Cart Loading -->
      <div v-else class="flex flex-col items-center justify-center min-h-100">
        <LoadingIcon />
      </div>
    </ClientOnly>
  </main>
</template>

<style scoped>
.order-summary-card {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  padding: 1.5rem;
}

.summary-rows {
  font-size: 0.875rem;
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.summary-value {
  color: var(--color-charcoal);
  font-weight: 500;
}

.summary-total-row {
  border-top: 1px solid var(--color-sand);
  padding-top: 0.75rem;
  margin-top: 0.5rem;
}

.summary-total-label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-charcoal);
}

.summary-total-value {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  color: var(--color-charcoal);
}

.checkout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-cream);
  background-color: var(--color-charcoal);
  border: 1px solid var(--color-charcoal);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.checkout-btn:hover {
  background-color: transparent;
  color: var(--color-charcoal);
}

.cart-list > * + * {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-sand);
}
</style>
