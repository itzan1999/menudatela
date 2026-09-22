<script setup>
const { cart, isCartMutating } = useCart();
</script>

<template>
  <aside v-if="cart" class="order-summary mb-8 w-full min-h-70 p-4 sm:p-8 relative">
    <h2 class="order-summary-title">{{ $t('shop.orderSummary') }}</h2>

    <ul class="flex flex-col gap-4 overflow-y-auto">
      <CartCard v-for="item in cart.contents.nodes" :key="item.key" :item />
    </ul>

    <AddCoupon class="my-8" />

    <div class="grid gap-1 text-sm font-semibold order-summary-line">
      <div class="flex justify-between">
        <span>{{ $t('shop.subtotal') }}</span>
        <span class="order-summary-value tabular-nums" v-html="cart.subtotal"></span>
      </div>
      <div class="flex justify-between">
        <span>{{ $t('general.shipping') }}</span>
        <span class="order-summary-value tabular-nums">
          {{ Number.parseFloat(cart.shippingTotal) > 0 ? '+' : '' }} <span v-html="cart.shippingTotal"></span>
        </span>
      </div>
      <Transition name="scale-y" mode="out-in">
        <div v-if="cart && cart.appliedCoupons" class="flex justify-between">
          <span>{{ $t('shop.discount') }}</span>
          <span class="order-summary-discount tabular-nums">- <span v-html="cart.discountTotal"></span></span>
        </div>
      </Transition>
      <div class="flex justify-between mt-4 pt-4 order-summary-total-row">
        <span class="text-base">{{ $t('shop.total') }}</span>
        <span class="order-summary-total tabular-nums" v-html="cart.total"></span>
      </div>
    </div>

    <slot></slot>

    <div v-if="isCartMutating" class="absolute inset-0 flex items-center justify-center order-summary-overlay">
      <LoadingIcon color="var(--color-charcoal)" />
    </div>
  </aside>
</template>

<style scoped>
@reference "#tailwind";

.order-summary {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.order-summary-title {
  margin-bottom: 1.25rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-sand);
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 500;
  line-height: 1.1;
  color: var(--color-charcoal);
}

.order-summary-line {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.order-summary-value {
  color: var(--color-charcoal);
}

.order-summary-discount {
  color: #6b7a4f;
}

.order-summary-total-row {
  border-top: 1px solid var(--color-sand);
}

.order-summary-total {
  font-family: var(--font-serif);
  font-size: 1.375rem;
  font-weight: 500;
  color: var(--color-charcoal);
}

.order-summary-overlay {
  background-color: color-mix(in oklab, var(--color-cream) 60%, transparent);
}

@container (min-width: 64rem) {
  .order-summary {
    @apply max-w-md sticky top-32;
  }
}
</style>
