<script setup lang="ts">
import type { Order } from '#types/gql';

const props = defineProps<{ order: Order }>();
const { t } = useI18n();

const readableStatus = computed(() => {
  const status = props.order?.status;
  if (!status) return '';

  const fallback = status.replace(/_/g, ' ');
  const translationKey = `shop.orderStatuses.${status.toLowerCase()}`;
  const translation = t(translationKey);

  return translation === translationKey ? fallback : translation;
});
</script>

<template>
  <span :class="`order-${order?.status}`" class="order-status">{{ readableStatus }}</span>
</template>

<style scoped>
@reference "#tailwind";

.order-status {
  @apply inline-block border px-2 py-1 font-sans text-[10px] leading-none font-semibold tracking-widest uppercase;
  background-color: transparent;
  border-color: var(--color-sand);
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
}

.order-COMPLETED {
  border-color: var(--color-charcoal);
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.order-CANCELLED {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.order-PENDING,
.order-PROCESSING {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}
</style>
