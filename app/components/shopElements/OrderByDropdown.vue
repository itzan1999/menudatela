<script setup>
const { getOrderQuery, setOrderQuery } = await useSorting();
const { storeSettings } = useAppConfig();
const selectedOrder = ref(getOrderQuery());
const orderby = ref(selectedOrder.value.orderBy || 'date');
const order = ref(selectedOrder.value.order);

watch([orderby, order], () => {
  setOrderQuery(orderby.value, order.value);
});
</script>

<template>
  <div
    class="inline-flex items-center border border-[var(--color-sand)] bg-[var(--color-cream)]/80 text-xs font-sans tracking-wider uppercase text-[var(--color-charcoal)] transition-colors hover:border-[var(--color-charcoal)]">
    <!-- Botón de dirección de orden (Ascendente / Descendente) -->
    <button
      type="button"
      class="flex items-center justify-center border-r border-[var(--color-sand)]/60 px-2.5 py-2 text-[var(--color-charcoal)]/60 hover:text-[var(--color-charcoal)] transition-colors cursor-pointer"
      aria-label="Cambiar dirección de orden"
      @click="order = order === 'ASC' ? 'DESC' : 'ASC'">
      <Icon name="ion:filter-outline" class="h-4 w-4 transition-transform duration-200" :class="order === 'ASC' ? 'rotate-180' : ''" />
    </button>

    <!-- Selector de criterio -->
    <div class="relative flex items-center pr-2">
      <select
        v-model="orderby"
        name="orderby"
        aria-label="Ordenar por"
        class="cursor-pointer appearance-none bg-transparent py-2 pl-3 pr-6 text-xs font-medium tracking-wider uppercase text-[var(--color-charcoal)] outline-none">
        <option value="date" class="bg-[var(--color-cream)]">{{ $t('general.latest') }}</option>
        <option value="alphabetically" class="bg-[var(--color-cream)]">{{ $t('general.alphabetically') }}</option>
        <option value="price" class="bg-[var(--color-cream)]">{{ $t('shop.price') }}</option>
        <option v-if="storeSettings.showReviews" value="rating" class="bg-[var(--color-cream)]">{{ $t('shop.rating') }}</option>
        <option value="discount" class="bg-[var(--color-cream)]">{{ $t('shop.discount') }}</option>
      </select>
      <Icon name="ion:chevron-down-outline" class="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[var(--color-charcoal)]/60" />
    </div>
  </div>
</template>
