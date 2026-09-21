<script setup lang="ts">
import type { ImageFragment, Product, ProductVariationFragment, VariationAttribute } from '#types/gql';

const route = useRoute();
const { storeSettings } = useAppConfig();

const props = defineProps({
  node: { type: Object as PropType<Product>, required: true },
  index: { type: Number, default: 1 },
});

type ProductImage = {
  src: string;
  alt: string;
  title: string;
  key: string;
};

// Proporción 3:4 elegante para las imágenes
const imgWidth = 300;
const imgHeight = 400;
const isFirstProduct = computed(() => props.index === 0);

// Extraer tipo de tejido (desde taxonomías o categorías)
const fabricType = computed(() => {
  if (!props.node) return '';
  const categories = props.node.productCategories?.nodes;
  if (categories && categories.length > 0) {
    return categories[0].name;
  }
  return 'Tela Premium';
});

// Comprobar disponibilidad de stock
const isOutOfStock = computed(() => props.node?.stockStatus === 'OUT_OF_STOCK');

const paColor = computed(() => (route.query?.filter as string | undefined)?.split('pa_color[')[1]?.split(']')[0]?.split(',') || []);
const placeholderImage = '/images/placeholder.jpg';

const sliderRef = ref<HTMLElement | null>(null);
const currentSlide = ref(0);

const mainImage = computed<string>(() => props.node?.image?.productCardSourceUrl || props.node?.image?.sourceUrl || placeholderImage);

const matchesSelectedColor = (variation: ProductVariationFragment) => {
  if (!paColor.value.length) return false;
  const hasMatchingAttributes = variation.attributes?.nodes?.some((attribute: VariationAttribute) =>
    paColor.value.some((color) => attribute?.value?.includes(color)),
  );
  const hasMatchingSlug = paColor.value.some((color) => variation.slug?.includes(color));
  return hasMatchingAttributes || hasMatchingSlug;
};

const sliderImages = computed<ProductImage[]>(() => {
  const images: ProductImage[] = [];
  const seen = new Set<string>();
  const addImage = (image: ProductImage) => {
    if (!image?.src || seen.has(image.src)) return;
    seen.add(image.src);
    images.push(image);
  };
  const addVariationImage = (variation: ProductVariationFragment) => {
    const src = variation?.image?.productCardSourceUrl || variation?.image?.sourceUrl;
    if (!src) return;
    addImage({
      src,
      alt: variation?.image?.altText || props.node?.name || 'Product image',
      title: variation?.image?.title || props.node?.name || 'Product image',
      key: `variation-${variation?.databaseId || src}`,
    });
  };
  const addGalleryImage = (image: ImageFragment) => {
    if (!image?.sourceUrl) return;
    addImage({
      src: image.sourceUrl,
      alt: image?.altText || props.node?.name || 'Product image',
      title: image?.title || props.node?.name || 'Product image',
      key: `gallery-${image?.databaseId || image?.sourceUrl}`,
    });
  };

  const variations = props.node?.variations?.nodes || [];
  const gallery = props.node?.galleryImages?.nodes || [];
  const main = {
    src: mainImage.value,
    alt: props.node?.image?.altText || props.node?.name || 'Product image',
    title: props.node?.image?.title || props.node?.name || 'Product image',
    key: `main-${props.node?.image?.databaseId || mainImage.value}`,
  };

  if (paColor.value.length) {
    const matching = variations.filter((variation: ProductVariationFragment) => matchesSelectedColor(variation));
    if (matching.length) {
      if (matching.some((variation: ProductVariationFragment) => (variation?.image?.productCardSourceUrl || variation?.image?.sourceUrl) === main.src)) {
        addImage(main);
      }
      matching.forEach(addVariationImage);
      return images;
    }
  }

  if (main.src !== placeholderImage || (!variations.length && !gallery.length)) {
    addImage(main);
  }

  variations.forEach(addVariationImage);
  gallery.forEach(addGalleryImage);

  return images;
});

const activeVariationImageSrc = computed<string | null>(() => {
  if (!paColor.value.length) return null;
  const variations = props.node?.variations?.nodes || [];
  const activeColorImage = variations.filter((variation: ProductVariationFragment) => matchesSelectedColor(variation));
  if (activeColorImage?.length) return activeColorImage[0]?.image?.productCardSourceUrl || activeColorImage[0]?.image?.sourceUrl || null;
  return null;
});

const activeImageIndex = computed<number>(() => {
  if (!activeVariationImageSrc.value) return 0;
  const index = sliderImages.value.findIndex((image) => image.src === activeVariationImageSrc.value);
  return Math.max(index, 0);
});

const productLink = computed<string>(() => {
  const baseUrl = `/product/${decodeURIComponent(props.node.slug || '')}`;
  if (paColor.value.length) {
    return `${baseUrl}?pa_color=${paColor.value[0]}`;
  }
  return baseUrl;
});

const updateCurrentSlide = () => {
  const container = sliderRef.value;
  if (!container) return;
  const firstSlide = container.querySelector('.product-card-slide') as HTMLElement | null;
  const slideWidth = firstSlide?.offsetWidth || container.clientWidth;
  const styles = getComputedStyle(container);
  const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
  const stride = slideWidth + gap;
  const index = stride ? Math.round(container.scrollLeft / stride) : 0;
  currentSlide.value = Math.min(Math.max(index, 0), Math.max(sliderImages.value.length - 1, 0));
};

const scrollToSlide = (index: number) => {
  const container = sliderRef.value;
  if (!container) return;
  const target = container.querySelector(`[data-index="${index}"]`) as HTMLElement | null;
  if (!target) return;
  container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
};

// Navegación por flechas (anterior / siguiente)
const prevSlide = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const prevIndex = currentSlide.value > 0 ? currentSlide.value - 1 : sliderImages.value.length - 1;
  scrollToSlide(prevIndex);
};

const nextSlide = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  const nextIndex = currentSlide.value < sliderImages.value.length - 1 ? currentSlide.value + 1 : 0;
  scrollToSlide(nextIndex);
};

const syncActiveSlide = () => {
  nextTick(() => {
    const activeIndex = activeImageIndex.value;
    if (activeIndex === 0) {
      currentSlide.value = 0;
      return;
    }

    const container = sliderRef.value;
    if (!container?.children?.length) return;
    const target = container.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null;
    if (target) {
      container.scrollTo({ left: target.offsetLeft, behavior: 'smooth' });
    }
    currentSlide.value = activeIndex;
  });
};

onMounted(() => {
  syncActiveSlide();

  watch(() => [activeImageIndex.value, sliderImages.value.length], syncActiveSlide);
});
</script>

<template>
  <div
    class="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-[var(--color-sand)]/60 bg-[var(--color-cream)]/40 p-3 transition-all duration-500 ease-out hover:border-[var(--color-charcoal)]/30 hover:bg-[var(--color-cream)]/80 hover:shadow-lg">
    <!-- Contenedor Principal de Imagen con Slider -->
    <div class="relative block overflow-hidden rounded-sm">
      <!-- Badges de Estado (Oferta / Agotado) -->
      <div class="absolute left-3 top-3 z-20 flex flex-col gap-1 pointer-events-none">
        <span
          v-if="node.onSale"
          class="bg-[var(--color-charcoal)] px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-[var(--color-cream)]">
          {{ $t('shop.onSale') }}
        </span>
        <span v-if="isOutOfStock" class="bg-stone-300 px-2 py-0.5 font-sans text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-700">
          {{ $t('shop.outOfStock') }}
        </span>
      </div>

      <!-- Slider de Imágenes con Aspect Ratio 3:4 y Zoom Sutil -->
      <div
        ref="sliderRef"
        class="no-slider flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain overscroll-y-auto [-webkit-overflow-scrolling:touch]"
        @scroll.passive="updateCurrentSlide">
        <template v-for="(image, slideIndex) in sliderImages" :key="image.key">
          <NuxtLink
            v-if="node.slug"
            class="product-card-slide block flex-[0_0_100%] snap-start snap-always aspect-[3/4] overflow-hidden rounded-sm"
            :data-index="slideIndex"
            :to="productLink">
            <NuxtPicture
              :width="imgWidth"
              :height="imgHeight"
              :src="image.src"
              :alt="image.alt"
              :title="image.title"
              :loading="slideIndex === 0 && isFirstProduct ? 'eager' : 'lazy'"
              :preload="slideIndex === 0 && isFirstProduct ? { fetchPriority: 'high' } : false"
              :sizes="`sm:${imgWidth / 2}px md:${imgWidth}px`"
              :img-attrs="{
                class: 'object-cover object-center w-full h-full rounded-sm transition-transform duration-700 ease-out group-hover:scale-105',
                fetchpriority: slideIndex === 0 && isFirstProduct ? 'high' : undefined,
              }" />
          </NuxtLink>
          <div v-else class="product-card-slide block flex-[0_0_100%] snap-start snap-always aspect-[3/4] overflow-hidden rounded-sm" :data-index="slideIndex">
            <NuxtPicture
              :width="imgWidth"
              :height="imgHeight"
              :src="image.src"
              :alt="image.alt"
              :title="image.title"
              :loading="slideIndex === 0 && isFirstProduct ? 'eager' : 'lazy'"
              :preload="slideIndex === 0 && isFirstProduct ? { fetchPriority: 'high' } : false"
              :sizes="`sm:${imgWidth / 2}px md:${imgWidth}px`"
              :img-attrs="{
                class: 'object-cover object-center w-full h-full rounded-sm transition-transform duration-700 ease-out group-hover:scale-105',
                fetchpriority: slideIndex === 0 && isFirstProduct ? 'high' : undefined,
              }" />
          </div>
        </template>
      </div>

      <!-- Flechas de navegación laterales al hacer Hover -->
      <template v-if="sliderImages.length > 1">
        <button
          type="button"
          aria-label="Imagen anterior"
          class="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-cream)]/90 text-[var(--color-charcoal)] opacity-0 shadow-md transition-all duration-300 hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] group-hover:opacity-100"
          @click="prevSlide">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          aria-label="Imagen siguiente"
          class="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-cream)]/90 text-[var(--color-charcoal)] opacity-0 shadow-md transition-all duration-300 hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] group-hover:opacity-100"
          @click="nextSlide">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </template>

      <!-- Botón Flotante "Ver Detalle" en la parte inferior al hacer Hover -->
      <NuxtLink
        v-if="node.slug"
        :to="productLink"
        class="absolute inset-x-0 bottom-0 z-10 flex translate-y-full transform items-center justify-center bg-gradient-to-t from-[var(--color-charcoal)]/50 to-transparent p-4 transition-transform duration-300 ease-in-out group-hover:translate-y-0">
        <span
          class="inline-block border border-[var(--color-cream)] bg-[var(--color-cream)] px-5 py-2 font-sans text-xs font-medium tracking-widest uppercase text-[var(--color-charcoal)] shadow-sm transition-colors hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)]">
          Ver Detalle
        </span>
      </NuxtLink>
    </div>

    <!-- Información del Producto -->
    <div class="mt-4 flex flex-1 flex-col justify-between text-center">
      <div>
        <!-- Categoría / Tipo de Tejido -->
        <p v-if="fabricType" class="font-sans text-[10px] font-medium tracking-[0.18em] uppercase text-[var(--color-charcoal)]/60">
          {{ fabricType }}
        </p>

        <!-- Título con Tipografía Serif (Fraunces) -->
        <NuxtLink v-if="node.slug" :to="productLink" :title="node.name || undefined">
          <h3 class="mt-1 font-serif text-base font-normal leading-tight text-[var(--color-charcoal)] transition-colors group-hover:opacity-75">
            {{ node.name }}
          </h3>
        </NuxtLink>

        <!-- Reseñas (si están habilitadas) -->
        <StarRating
          v-if="storeSettings.showReviews"
          :rating="node.averageRating ?? undefined"
          :count="node.reviewCount ?? undefined"
          class="mt-1 flex justify-center text-xs" />
      </div>

      <!-- Precio con indicación "/ metro" -->
      <div class="mt-3 flex items-baseline justify-center gap-1.5 border-t border-[var(--color-sand)]/40 pt-2.5">
        <ProductPrice
          class="font-sans text-sm font-semibold tracking-tight text-[var(--color-charcoal)]"
          :sale-price="node.salePrice ?? undefined"
          :regular-price="node.regularPrice ?? undefined" />
        <span class="font-sans text-[11px] font-normal text-[var(--color-charcoal)]/60"> / metro </span>
      </div>
    </div>
  </div>
</template>
