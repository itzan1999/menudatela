<script setup lang="ts">
const { getFilter, setFilter, isFiltersActive } = useFiltering();

const selectedTerms = ref<string[]>(getFilter('rating') || []);
const isOpen = ref(true);

watch(isFiltersActive, () => {
  if (!isFiltersActive.value) selectedTerms.value = [];
});

const radioClicked = (rating: string): void => {
  selectedTerms.value = selectedTerms.value.includes(rating) ? [] : [rating];
  setFilter('rating', selectedTerms.value);
};
</script>

<template>
  <div class="py-5">
    <div
      class="flex cursor-pointer items-center justify-between font-sans text-[12px] font-semibold tracking-wide uppercase text-[var(--color-charcoal)]/80"
      @click="isOpen = !isOpen">
      <span>{{ $t('shop.rating') }}</span>
      <Icon
        name="ion:chevron-down-outline"
        class="h-4 w-4 text-[var(--color-charcoal)]/60 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''" />
    </div>

    <div v-show="isOpen" class="mt-4 flex flex-col gap-2">
      <button
        v-for="starCount in [5, 4, 3, 2, 1]"
        :key="starCount"
        type="button"
        class="flex items-center justify-between border px-3 py-2 font-sans text-xs transition-all duration-200"
        :class="
          selectedTerms.includes(String(starCount))
            ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-cream)]'
            : 'border-[var(--color-sand)]/60 bg-transparent text-[var(--color-charcoal)]/80 hover:border-[var(--color-charcoal)]'
        "
        @click="radioClicked(String(starCount))">
        <!-- Generación de estrellas en tono ámbar/dorado cálido (#D97706) -->
        <div class="flex items-center gap-0.5">
          <span
            v-for="i in 5"
            :key="i"
            class="text-[13px]"
            :class="i <= starCount ? 'text-amber-600' : selectedTerms.includes(String(starCount)) ? 'text-white/20' : 'text-[var(--color-sand)]'">
            ★
          </span>
        </div>
        <span class="text-[10px] tracking-wider uppercase font-medium opacity-80">
          {{ starCount === 5 ? $t('shop.fiveStars') : $t('shop.andMore') }}
        </span>
      </button>
    </div>
  </div>
</template>
