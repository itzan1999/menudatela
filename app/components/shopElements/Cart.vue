<script setup lang="ts">
const { cart, toggleCart, isCartMutating } = useCart();
</script>

<template>
  <div class="fixed top-0 bottom-0 right-0 z-50 flex flex-col w-11/12 max-w-lg overflow-x-hidden cart-drawer">
    <Icon name="ion:close-outline" class="absolute p-1 rounded-lg top-6 left-6 md:left-8 cursor-pointer close-icon" size="34" @click="toggleCart(false)" />

    <EmptyCart v-if="cart && !cart.isEmpty" class="rounded-lg p-1.5 empty-cart-btn" />

    <div class="mt-8 text-center cart-title">
      {{ $t('shop.cart') }}
      <span v-if="cart?.contents?.productCount"> ({{ cart?.contents?.productCount }}) </span>
    </div>

    <ClientOnly>
      <template v-if="cart && !cart.isEmpty">
        <ul class="flex flex-col flex-1 cart-list p-6 overflow-y-scroll md:p-8">
          <li v-for="item in cart.contents?.nodes" :key="item.key">
            <CartCard :item />
          </li>
        </ul>
        <div class="px-6 pb-8 mb-safe md:px-8 space-y-4">
          <!-- Order Summary -->
          <div class="grid gap-1 text-sm font-semibold tabular-nums cart-summary">
            <!-- Subtotal -->
            <div class="flex justify-between">
              <span>{{ $t('shop.subtotal') }}</span>
              <span class="cart-summary-value" v-html="cart.subtotal"></span>
            </div>
            <!-- Shipping -->
            <div v-if="cart.shippingTotal" class="flex justify-between">
              <span>{{ $t('general.shipping') }}</span>
              <span class="cart-summary-value"> {{ Number.parseFloat(cart.shippingTotal) > 0 ? '+' : '' }} <span v-html="cart.shippingTotal"></span> </span>
            </div>
            <!-- Discount -->
            <div v-if="cart.discountTotal && Number.parseFloat(cart.rawDiscountTotal || '0') > 0" class="flex justify-between">
              <span>{{ $t('shop.discount') }}</span>
              <span class="text-primary">- <span v-html="cart.discountTotal"></span></span>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-4">
            <NuxtLink to="/cart" class="cart-btn cart-btn--outline" @click="toggleCart()">
              {{ $t('shop.viewCart') }}
            </NuxtLink>
            <NuxtLink
              :to="isCartMutating ? undefined : '/checkout'"
              class="cart-btn cart-btn--solid flex-1"
              :class="{ 'pointer-events-none opacity-50': isCartMutating }"
              @click="!isCartMutating && toggleCart()">
              {{ $t('shop.checkout') }} &nbsp;<span v-html="cart.total"></span>
            </NuxtLink>
          </div>
        </div>
      </template>
      <!-- Empty Cart Message -->
      <EmptyCartMessage v-else-if="cart && cart.isEmpty" />
      <!-- Cart Loading -->
      <div v-else class="flex flex-col items-center justify-center flex-1 mb-20">
        <LoadingIcon />
      </div>
    </ClientOnly>
    <!-- Cart Loading Overlay -->
    <div v-if="cart && isCartMutating" class="absolute inset-0 flex items-center justify-center bg-cream/40">
      <LoadingIcon />
    </div>
  </div>
</template>

<style scoped>
.cart-drawer {
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

.cart-title {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-charcoal);
}

.cart-summary {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.cart-summary-value {
  color: var(--color-charcoal);
}

.cart-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-align: center;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.cart-btn--outline {
  color: var(--color-charcoal);
  border: 1px solid var(--color-charcoal);
  background-color: transparent;
}

.cart-btn--outline:hover {
  background-color: var(--color-sand);
}

.cart-btn--solid {
  color: var(--color-cream);
  background-color: var(--color-charcoal);
  border: 1px solid var(--color-charcoal);
}

.cart-btn--solid:hover {
  background-color: transparent;
  color: var(--color-charcoal);
}

.empty-cart-btn {
  color: var(--color-charcoal);
  opacity: 0.6;
  transition:
    opacity 0.2s ease,
    color 0.2s ease;
}

.empty-cart-btn:hover {
  opacity: 1;
  color: #9a3b26;
}

.cart-list > * + * {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-sand);
}
</style>
