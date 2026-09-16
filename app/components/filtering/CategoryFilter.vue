<script setup>
const { getFilter, setFilter, isFiltersActive } = useFiltering();

const props = defineProps({
  terms: { type: Array, required: true },
  label: { type: String, default: '' },
  openByDefault: { type: Boolean, default: true },
  showCount: { type: Boolean, default: true },
});

const isOpen = ref(props.openByDefault);
const selectedTerms = ref(getFilter('category') || []);

const route = useRoute();
const routeSlug = route.params.slug ?? route.params.categorySlug;
const categorySlug = Array.isArray(routeSlug) ? routeSlug[0] : routeSlug;
if (categorySlug) selectedTerms.value = [categorySlug];

watch(isFiltersActive, () => {
  if (!isFiltersActive.value) selectedTerms.value = [];
});

const toggleTerm = (slug) => {
  if (selectedTerms.value.includes(slug)) {
    selectedTerms.value = selectedTerms.value.filter((s) => s !== slug);
  } else {
    selectedTerms.value.push(slug);
  }
  setFilter('category', selectedTerms.value);
};
</script>

<template>
  <div v-if="terms.length" class="py-5">
    <div class="flex cursor-pointer items-center justify-between font-serif text-sm font-medium text-[var(--color-charcoal)]" @click="isOpen = !isOpen">
      <span class="tracking-wide uppercase text-[12px] font-sans font-semibold text-[var(--color-charcoal)]/80">{{ label || $t('shop.category', 2) }}</span>
      <Icon
        name="ion:chevron-down-outline"
        class="h-4 w-4 text-[var(--color-charcoal)]/60 transition-transform duration-200"
        :class="isOpen ? 'rotate-180' : ''" />
    </div>

    <!-- Píldoras Minimalistas -->
    <div v-show="isOpen" class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="term in terms"
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
        <span v-if="showCount" class="text-[10px] opacity-60">({{ term.count || 0 }})</span>
      </button>
    </div>
  </div>
</template>
