<script setup lang="ts">
import type { Product, Variation } from '#types/gql';

const props = defineProps({
  node: { type: Object as PropType<Product | Variation>, required: true },
});

const discountPercentage = computed(() => {
  const reg = Number.parseFloat(props.node?.regularPrice?.replace(/[^0-9.-]+/g, '') || '0');
  const sale = Number.parseFloat(props.node?.salePrice?.replace(/[^0-9.-]+/g, '') || '0');
  if (reg > 0 && sale > 0 && sale < reg) {
    return Math.round(((reg - sale) / reg) * 100);
  }
  return null;
});

const isOnSale = computed(() => props.node?.onSale ?? false);
</script>

<template>
  <span
    v-if="isOnSale"
    class="inline-block border border-[var(--color-charcoal)] bg-[var(--color-charcoal)] px-2.5 py-1 font-sans text-[10px] font-semibold tracking-widest uppercase text-[var(--color-cream)]">
    OFERTA {{ discountPercentage ? `DEL ${discountPercentage}%` : '' }}
  </span>
</template>
