<script setup lang="ts">
const { updateItemQuantity, isUpdatingCart, cart } = useCart();
const { debounce } = useHelpers();

const { item } = defineProps({ item: { type: Object, required: true } });

const productType = computed(() => (item.variation ? item.variation?.node : item.product?.node));
const quantity = ref(item.quantity);
const hasNoMoreStock = computed(() => (productType.value.stockQuantity ? productType.value.stockQuantity <= quantity.value : false));
const isOptimisticItem = computed(() => String(item.key || '').startsWith('optimistic:'));

const incrementQuantity = () => quantity.value++;
const decrementQuantity = () => quantity.value--;

const debouncedUpdateQuantity = debounce((qty: unknown) => {
  if (Number.isFinite(qty as number) && (qty as number) >= 0) updateItemQuantity(item.key, qty as number);
}, 250);

watch(quantity, debouncedUpdateQuantity);

const onFocusOut = () => {
  if (quantity.value === '') {
    const cartItem = cart.value?.contents?.nodes?.find((node) => node.key === item.key);
    if (cartItem) {
      quantity.value = cartItem.quantity;
    }
  }
};
</script>

<template>
  <div class="qty-input">
    <button
      title="Decrease Quantity"
      aria-label="Decrease Quantity"
      type="button"
      class="qty-btn"
      :disabled="isUpdatingCart || isOptimisticItem || quantity <= 0"
      @click="decrementQuantity">
      <Icon name="ion:remove" size="13" />
    </button>
    <input
      v-model.number="quantity"
      type="number"
      min="0"
      :max="productType.stockQuantity"
      :disabled="isOptimisticItem"
      aria-label="Quantity"
      class="qty-field"
      @focusout="onFocusOut" />
    <button
      title="Increase Quantity"
      aria-label="Increase Quantity"
      type="button"
      class="qty-btn"
      :disabled="isUpdatingCart || isOptimisticItem || hasNoMoreStock"
      @click="incrementQuantity">
      <Icon name="ion:add" size="13" />
    </button>
  </div>
</template>

<style scoped>
.qty-input {
  display: flex;
  align-items: stretch;
  font-size: 0.75rem;
  line-height: 1;
  border: 1px solid var(--color-sand);
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-charcoal);
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.qty-btn:hover:not(:disabled) {
  background-color: var(--color-sand);
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-field {
  width: 2rem;
  padding: 0 0.25rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-charcoal);
  background-color: transparent;
  border-left: 1px solid var(--color-sand);
  border-right: 1px solid var(--color-sand);
  outline: none;
}

input[type='number']::-webkit-inner-spin-button,
input[type='number']::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
