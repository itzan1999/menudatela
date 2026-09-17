<script setup lang="ts">
import type { Product } from '#types/gql';

const { product } = defineProps({
  product: { type: Object as PropType<Product>, required: true },
});
const { storeSettings } = useAppConfig();
const { t } = useI18n();

const reviewCount = computed(() => ('reviewCount' in product ? (product.reviewCount ?? undefined) : undefined));

const openDescription = ref(true);
const openReviews = ref(false);
</script>

<template>
  <div class="divide-y divide-[var(--color-sand)]">
    <!-- Acordeón: Descripción -->
    <div v-if="product.description" class="py-5">
      <button
        type="button"
        class="flex w-full items-center justify-between py-2 text-left font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-charcoal)] cursor-pointer"
        @click="openDescription = !openDescription">
        <span>{{ $t('shop.productDescription') }}</span>
        <Icon
          name="ion:chevron-down-outline"
          class="h-4 w-4 text-[var(--color-charcoal)]/60 transition-transform duration-200"
          :class="openDescription ? 'rotate-180' : ''" />
      </button>

      <div
        v-show="openDescription"
        class="pt-4 pb-2 font-sans text-sm leading-relaxed text-[var(--color-charcoal)]/80 prose max-w-none"
        v-html="product.description"></div>
    </div>

    <!-- Acordeón: Reseñas -->
    <div v-if="storeSettings.showReviews" class="py-5">
      <button
        type="button"
        class="flex w-full items-center justify-between py-2 text-left font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-charcoal)] cursor-pointer"
        @click="openReviews = !openReviews">
        <div class="flex items-center gap-2">
          <span>{{ $t('shop.reviews') }}</span>
          <span v-if="reviewCount" class="text-[10px] bg-[var(--color-sand)]/40 px-2 py-0.5 font-sans font-medium text-[var(--color-charcoal)]">
            {{ reviewCount }}
          </span>
        </div>
        <Icon
          name="ion:chevron-down-outline"
          class="h-4 w-4 text-[var(--color-charcoal)]/60 transition-transform duration-200"
          :class="openReviews ? 'rotate-180' : ''" />
      </button>

      <div v-show="openReviews" class="pt-4 pb-2">
        <ProductReviews :product="product" />
      </div>
    </div>
  </div>
</template>
