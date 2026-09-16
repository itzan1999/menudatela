<script setup lang="ts">
import { TaxonomyEnum } from '#gql/default';
import type { WooNuxtFilter } from '#types/gql';

const { isFiltersActive, resetFilter, getFilter, setFilter } = useFiltering();
const { removeBodyClass } = useHelpers();
const runtimeConfig = useRuntimeConfig();
const { storeSettings } = useAppConfig();

const { hideCategories } = defineProps({ hideCategories: { type: Boolean, default: false } });

const globalProductAttributes = (runtimeConfig?.public?.GLOBAL_PRODUCT_ATTRIBUTES as WooNuxtFilter[]) || [];
const taxonomies = globalProductAttributes.map((attr) => attr?.slug?.toUpperCase().replace(/_/g, '')) as TaxonomyEnum[];

const { data } = await useAsyncGql('getAllTerms', { taxonomies: [...taxonomies, TaxonomyEnum.Productcategory] });
const terms = data.value?.terms?.nodes ?? [];

const productCategoryTerms = terms.filter((term) => term.taxonomyName === 'product_cat');
const attributesWithTerms = globalProductAttributes.map((attr) => ({ ...attr, terms: terms.filter((term) => term.taxonomyName === attr.slug) }));

// Estructura limpia para mapear insignia -> parámetro real del filtro
const activeBadges = computed(() => {
  const badges: { key: string; label: string; displayValue: string; rawValue: string }[] = [];

  // Categorías
  const cats = getFilter('category') || [];
  cats.forEach((slug: string) => {
    const match = productCategoryTerms.find((t) => t.slug === slug);
    badges.push({
      key: 'category',
      label: 'Categoría',
      displayValue: match?.name || slug,
      rawValue: slug,
    });
  });

  // Atributos dinámicos
  attributesWithTerms.forEach((attr) => {
    const selected = getFilter(attr.slug) || [];
    selected.forEach((slug: string) => {
      const match = attr.terms.find((t) => t.slug === slug);
      badges.push({
        key: attr.slug,
        label: attr.label || attr.slug,
        displayValue: match?.name || slug,
        rawValue: slug,
      });
    });
  });

  // En oferta
  const sale = getFilter('sale') || [];
  if (sale.length) {
    badges.push({
      key: 'sale',
      label: 'Estado',
      displayValue: 'En Oferta',
      rawValue: sale[0],
    });
  }

  // Calificación
  const rating = getFilter('rating') || [];
  if (rating.length) {
    badges.push({
      key: 'rating',
      label: 'Calificación',
      displayValue: `${rating[0]}★ o más`,
      rawValue: rating[0],
    });
  }

  return badges;
});

// Eliminación exacta utilizando el valor crudo (slug / valor guardado en URL)
const removeBadge = (key: string, rawValue: string) => {
  if (key === 'sale' || key === 'rating') {
    setFilter(key, []);
    return;
  }

  const current: string[] = getFilter(key) || [];
  const updated = current.filter((v: string) => String(v) !== String(rawValue));
  setFilter(key, updated);
};
</script>

<template>
  <aside id="filters" class="w-[280px]">
    <OrderByDropdown class="block w-full mb-6 md:hidden" />

    <!-- Badges de Filtros Activos con eliminación funcional -->
    <div v-if="isFiltersActive" class="mt-6 mb-6 flex flex-col gap-2 border-b border-[var(--color-sand)]/50 pb-6">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="badge in activeBadges"
          :key="`${badge.key}-${badge.rawValue}`"
          class="flex items-center gap-1.5 border border-[var(--color-sand)] bg-[var(--color-cream)]/80 px-2.5 py-1 font-sans text-[11px] tracking-wider uppercase text-[var(--color-charcoal)]">
          <span class="opacity-60">{{ badge.label }}:</span>
          <span class="font-semibold">{{ badge.displayValue }}</span>
          <button
            type="button"
            class="ml-1 leading-none text-[15px] opacity-40 hover:opacity-100 transition-opacity cursor-pointer px-0.5"
            aria-label="Quitar filtro"
            @click.prevent="removeBadge(badge.key, badge.rawValue)">
            ×
          </button>
        </div>
      </div>

      <button
        type="button"
        class="mt-1 self-start font-sans text-xs font-medium tracking-widest uppercase text-[var(--color-charcoal)]/60 underline underline-offset-4 transition-colors hover:text-[var(--color-charcoal)] cursor-pointer"
        @click="resetFilter">
        Limpiar filtros
      </button>
    </div>

    <!-- Lista de Filtros -->
    <div class="relative z-30 flex flex-col divide-y divide-[var(--color-sand)]/50">
      <PriceFilter />
      <CategoryFilter v-if="!hideCategories" :terms="productCategoryTerms" />
      <div v-for="attribute in attributesWithTerms" :key="attribute.slug">
        <ColorFilter v-if="attribute.slug == 'pa_color' || attribute.slug == 'pa_colour'" :attribute />
        <GlobalFilter v-else :attribute />
      </div>
      <OnSaleFilter />
      <StarRatingFilter v-if="storeSettings.showReviews" />
    </div>
  </aside>

  <div class="fixed inset-0 z-50 hidden bg-[var(--color-charcoal)]/40 backdrop-blur-xs filter-overlay" @click="removeBodyClass('show-filters')"></div>
</template>

<style>
@reference "#tailwind";

#filters {
  &::-webkit-scrollbar {
    display: none;
  }
}

@media (max-width: 768px) {
  #filters {
    @apply fixed bottom-0 left-0 z-60 h-full w-[300px] overflow-auto bg-[var(--color-cream)] p-6 transition-transform duration-300 ease-in-out;
    transform: translateX(-100%);
  }

  .show-filters #filters {
    transform: translateX(0);
  }
}
</style>
