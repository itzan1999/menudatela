<script setup lang="ts">
import { SliderRoot, SliderTrack, SliderRange, SliderThumb } from 'reka-ui';

const { getFilter, setFilter, isFiltersActive } = useFiltering();
const runtimeConfig = useRuntimeConfig();
const maxLimit = Number(runtimeConfig?.public?.MAX_PRICE) || 200;

const isOpen = ref(true);
const maxPrice = ref<number[]>([getFilter('price')?.[1] ? Number(getFilter('price')[1]) : maxLimit]);

const applyFilter = () => {
  if (maxPrice.value[0] >= maxLimit) {
    setFilter('price', []);
  } else {
    setFilter('price', [0, maxPrice.value[0]]);
  }
};

watch(isFiltersActive, () => {
  if (!isFiltersActive.value) maxPrice.value = [maxLimit];
});
</script>

<template>
  <div class="py-5">
    <div
      class="flex cursor-pointer items-center justify-between font-sans text-[12px] font-semibold tracking-wide uppercase text-[var(--color-charcoal)]/80"
      @click="isOpen = !isOpen">
      <span>{{ $t('shop.price') }}</span>
      <Icon
        name="ion:chevron-down-outline"
        class="h-4 w-4 text-[var(--color-charcoal)]/60 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''" />
    </div>

    <div v-show="isOpen" class="mt-4 flex flex-col gap-3">
      <div class="flex items-center justify-between font-sans text-xs text-[var(--color-charcoal)]/70">
        <span>Hasta</span>
        <span class="font-semibold text-[var(--color-charcoal)]">{{ maxPrice[0] }} €</span>
      </div>

      <ClientOnly>
        <SliderRoot v-model="maxPrice" :min="10" :max="maxLimit" :step="5" class="relative flex w-full items-center cursor-pointer" @value-commit="applyFilter">
          <SliderTrack class="relative h-1 w-full flex-1 rounded-full bg-[var(--color-sand)]/60">
            <SliderRange class="absolute h-full rounded-full bg-[var(--color-charcoal)]" />
          </SliderTrack>
          <SliderThumb
            class="block h-4 w-4 rounded-full border border-[var(--color-sand)] bg-[var(--color-cream)] shadow-xs outline-none transition-transform hover:scale-110" />
        </SliderRoot>
      </ClientOnly>
    </div>
  </div>
</template>
