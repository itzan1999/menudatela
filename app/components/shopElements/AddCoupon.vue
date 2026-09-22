<script setup lang="ts">
const { cart, isUpdatingCoupon, applyCoupon, removeCoupon } = useCart();
const couponCode = ref<string>('');
const errorMessage = ref<string>('');

async function submitCoupon(): Promise<void> {
  const response = await applyCoupon(couponCode.value);
  if (!response.success && response.error) {
    errorMessage.value = response.error;
  } else {
    couponCode.value = '';
    errorMessage.value = '';
  }
}
</script>

<template>
  <div>
    <form class="flex gap-1" @submit.prevent="submitCoupon">
      <input
        id="couponCode"
        v-model="couponCode"
        type="text"
        :placeholder="$t('shop.couponCode')"
        class="coupon-input w-full outline-hidden px-4 py-2 text-sm"
        required />
      <Button
        :loading="isUpdatingCoupon"
        :disabled="couponCode === '' || isUpdatingCoupon"
        type="submit"
        variant="outline-charcoal"
        class="min-w-20 tracking-wider uppercase text-xs font-medium">
        {{ $t('general.apply') }}
      </Button>
    </form>
    <Transition name="scale-y" mode="out-in">
      <div v-if="errorMessage" class="mt-2 text-xs text-red-600" v-html="errorMessage"></div>
    </Transition>
    <Transition name="scale-y" mode="out-in">
      <div v-if="cart && cart.appliedCoupons" class="text-xs font-semibold uppercase flex flex-wrap gap-2">
        <div v-for="(coupon, index) in cart.appliedCoupons" :key="coupon?.code || index" class="flex flex-wrap mt-2 flex-2">
          <div v-if="coupon?.code" class="coupon-chip flex leading-none p-1.5 gap-1 items-center">
            <span v-html="coupon.code"></span>
            <Icon name="ion:close" class="cursor-pointer coupon-chip-remove" @click="removeCoupon(coupon.code)" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.coupon-input {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  color: var(--color-charcoal);
}

.coupon-input:focus-visible {
  border-color: var(--color-charcoal);
  outline: none;
}

.coupon-chip {
  color: var(--color-charcoal);
  background-color: color-mix(in oklab, var(--color-sand) 50%, transparent);
  border: 1px solid var(--color-sand);
}

.coupon-chip-remove {
  border-radius: 9999px;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.coupon-chip-remove:hover {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}
</style>
