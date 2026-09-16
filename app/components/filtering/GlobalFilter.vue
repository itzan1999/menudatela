<script setup lang="ts">
const { getFilter, setFilter, isFiltersActive } = useFiltering();

const { attribute } = defineProps({
  attribute: { type: Object, required: true },
});

const selectedTerms = ref(getFilter(attribute.slug) || []);
const filterTitle = ref(attribute.label || attribute.slug);
const isOpen = ref(attribute.openByDefault ?? true);

watch(isFiltersActive, () => {
  if (!isFiltersActive.value) selectedTerms.value = [];
});

const toggleTerm = (slug: string) => {
  if (selectedTerms.value.includes(slug)) {
    selectedTerms.value = selectedTerms.value.filter((s) => s !== slug);
  } else {
    selectedTerms.value.push(slug);
  }
  setFilter(attribute.slug, selectedTerms.value);
};
</script>

<template>
  <div class="py-5">
    <div
      class="flex cursor-pointer items-center justify-between font-sans text-[12px] font-semibold tracking-wide uppercase text-[var(--color-charcoal)]/80"
      @click="isOpen = !isOpen">
      <span>{{ filterTitle }}</span>
      <Icon
        name="ion:chevron-down-outline"
        class="h-4 w-4 text-[var(--color-charcoal)]/60 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''" />
    </div>

    <div v-show="isOpen" class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="term in attribute.terms"
        :key="term.slug"
        type="button"
        class="flex items-center gap-1.5 border px-3 py-1.5 font-sans text-xs tracking-wider uppercase transition-all duration-200"
        :class="
          selectedTerms.includes(term.slug)
            ? 'border-[var(--color-charcoal)] bg-[var(--color-charcoal)] text-[var(--color-cream)]'
            : 'border-[var(--color-sand)] bg-transparent text-[var(--color-charcoal)]/80 hover:border-[var(--color-charcoal)]'
        "
        @click="toggleTerm(term.slug)">
        <span v-html="term.name"></span>
        <span v-if="attribute.showCount" class="text-[10px] opacity-60">({{ term.count || 0 }})</span>
      </button>
    </div>
  </div>
</template>
