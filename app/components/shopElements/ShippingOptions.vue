<script setup>
const { updateShippingMethod } = useCart();

defineProps({
  options: { type: Array, required: true },
  activeOption: { type: String, required: true },
});

const setActiveOption = async (id) => {
  await updateShippingMethod(id);
};
</script>

<template>
  <div class="shipping-options" role="radiogroup" aria-label="Shipping methods">
    <button
      v-for="option in options"
      :key="option.id"
      type="button"
      class="shipping-option"
      :class="{ 'active-option': option.id === activeOption }"
      role="radio"
      :aria-checked="option.id === activeOption"
      @click="setActiveOption(option.id)">
      <span class="shipping-option-content">
        <span class="shipping-option-label" v-html="option.label"></span>
        <span class="shipping-option-price">{{ option.cost }}</span>
      </span>
      <icon name="ion:checkmark-circle" size="20" class="shipping-option-check" />
    </button>
  </div>
</template>

<style scoped>
@reference "#tailwind";

.shipping-options {
  @apply grid gap-3;
  container-type: inline-size;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.shipping-option {
  @apply flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors focus-visible:outline-none;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.shipping-option:hover {
  border-color: var(--color-charcoal);
}

.shipping-option-content {
  @apply flex flex-col gap-1 min-w-0;
}

.shipping-option-label {
  @apply text-sm font-medium;
  color: color-mix(in oklab, var(--color-charcoal) 80%, transparent);
}

.shipping-option-price {
  @apply text-base font-semibold;
  color: var(--color-charcoal);
}

.shipping-option-check {
  @apply opacity-0 transition-opacity;
  color: var(--color-charcoal);
}

.shipping-option.active-option {
  border-color: var(--color-charcoal);
  background-color: var(--color-cream);
}

.shipping-option.active-option .shipping-option-check {
  @apply opacity-100;
}

@container (max-width: 36rem) {
  .shipping-options {
    grid-template-columns: 1fr;
  }
}
</style>
