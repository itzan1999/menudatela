<script setup lang="ts">
import type { Product } from '#types/gql';

const props = defineProps({
  product: { type: Object as PropType<Product>, required: true },
});

const showForm = ref(false);

const averageRating = computed(() => ('averageRating' in props.product ? (props.product.averageRating ?? 0) : 0));

// En WooNuxt/WooGraphQL, reviews.edges es un array de objetos { rating, node }
const rawEdges = computed(() => (props.product?.reviews as any)?.edges ?? []);

// Calculamos el total de opiniones basándonos en la cantidad de edges
const reviewCount = computed(() => rawEdges.value.length);

// Mapeamos los edges extraídos de la query GraphQL
const reviews = computed(() => {
  return rawEdges.value.map((edge: any) => {
    const node = edge?.node ?? {};
    const rawRating = edge?.rating ?? node?.rating ?? 5;
    const rating = typeof rawRating === 'number' ? rawRating : Number.parseInt(String(rawRating), 10) || 5;

    return {
      id: node.id || node.databaseId || Math.random(),
      author: node.author?.node?.name || node.author?.name || 'Cliente',
      date: node.date ? new Date(node.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
      content: node.content || '',
      rating,
    };
  });
});

// Cálculo exacto del porcentaje de opiniones por cada puntuación de estrella
const getPercentageForStar = (starRating: number): number => {
  const total = reviews.value.length;
  if (!total) return 0;

  const countForStar = reviews.value.filter((review) => review.rating === starRating).length;
  return Math.round((countForStar / total) * 100);
};
</script>

<template>
  <div class="grid grid-cols-1 gap-10 lg:grid-cols-12">
    <!-- Columna Izquierda: Resumen y Barras -->
    <div class="space-y-6 lg:col-span-5">
      <div>
        <h3 class="mb-2 font-serif text-2xl text-[var(--color-charcoal)]">{{ $t('shop.customerReviews') }}</h3>
        <div class="flex items-center gap-3">
          <StarRating :rating="averageRating" />
          <span class="font-sans text-xs text-[var(--color-charcoal)]/70"> {{ $t('general.basedOn') }} {{ reviewCount }} {{ $t(reviewCount === 1 ? 'shop.reviewSingular' : 'shop.reviewPlural') }} </span>
        </div>
      </div>

      <!-- Barras de Distribución de Estrellas -->
      <div class="max-w-xs space-y-2">
        <div v-for="star in [5, 4, 3, 2, 1]" :key="star" class="flex items-center gap-3 font-sans text-xs text-[var(--color-charcoal)]/70">
          <span class="flex w-6 items-center gap-1 font-medium"> {{ star }} <Icon name="ion:star" class="h-3 w-3 text-amber-700" /> </span>
          <div class="h-2 flex-1 overflow-hidden bg-[var(--color-sand)]/40">
            <div class="h-full bg-amber-700 transition-all duration-300" :style="{ width: `${getPercentageForStar(star)}%` }"></div>
          </div>
        </div>
      </div>

      <!-- Acción para Escribir Opinión -->
      <div class="space-y-3 pt-4 border-t border-[var(--color-sand)]/60">
        <h4 class="font-serif text-lg text-[var(--color-charcoal)]">{{ $t('shop.shareExperience') }}</h4>
        <p class="font-sans text-xs leading-relaxed text-[var(--color-charcoal)]/70">{{ $t('shop.reviewInvitation') }}</p>

        <button
          type="button"
          class="flex h-11 w-full items-center justify-center border border-[var(--color-sand)] bg-transparent px-6 font-sans text-xs font-semibold uppercase tracking-widest text-[var(--color-charcoal)] transition-all duration-300 hover:border-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] cursor-pointer"
          @click="showForm = !showForm">
          {{ showForm ? $t('general.cancel') : $t('shop.writeReview') }}
        </button>
      </div>
    </div>

    <!-- Columna Derecha: Lista de Reseñas -->
    <div class="divide-y divide-[var(--color-sand)]/60 lg:col-span-7">
      <div v-if="reviews.length === 0" class="py-4 font-sans text-xs text-[var(--color-charcoal)]/60">{{ $t('shop.noReviewsAvailable') }}</div>

      <div v-for="review in reviews" :key="review.id" class="py-5 first:pt-0">
        <div class="mb-1 flex items-center justify-between">
          <span class="font-sans text-xs font-semibold text-[var(--color-charcoal)]">
            {{ review.author }}
          </span>
          <span v-if="review.date" class="font-sans text-[11px] text-[var(--color-charcoal)]/50">
            {{ review.date }}
          </span>
        </div>

        <div class="mb-2 flex items-center text-amber-700">
          <Icon v-for="i in 5" :key="i" :name="i <= review.rating ? 'ion:star' : 'ion:star-outline'" class="h-3.5 w-3.5" />
        </div>

        <div class="font-sans text-xs leading-relaxed text-[var(--color-charcoal)]/80 prose max-w-none" v-html="review.content"></div>
      </div>
    </div>
  </div>
</template>
