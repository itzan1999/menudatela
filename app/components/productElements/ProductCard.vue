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
  databaseId: number | null;
};

// Cuadrado, como el hueco que ocupará la imagen en la ficha de producto — con object-contain para
// que ambas muestren la foto entera con su propia proporción, en vez de recortarla de formas
// distintas en cada sitio.
const imgWidth = 400;
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

// Prefers the same full-size sourceUrl the product detail page's gallery uses (rather than the
// server-cropped productCardSourceUrl variant) — they need to be the exact same file for the
// zoom-in transition's proportions to line up; a separately-cropped thumbnail never will.
const preferredSrc = (image?: { sourceUrl?: string | null; productCardSourceUrl?: string | null } | null): string | undefined =>
  image?.sourceUrl || image?.productCardSourceUrl || undefined;

const mainImage = computed<string>(() => preferredSrc(props.node?.image) || placeholderImage);

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
    const src = preferredSrc(variation?.image);
    if (!src) return;
    addImage({
      src,
      alt: variation?.image?.altText || props.node?.name || 'Product image',
      title: variation?.image?.title || props.node?.name || 'Product image',
      key: `variation-${variation?.databaseId || src}`,
      databaseId: variation?.image?.databaseId ?? null,
    });
  };
  const addGalleryImage = (image: ImageFragment) => {
    if (!image?.sourceUrl) return;
    addImage({
      src: image.sourceUrl,
      alt: image?.altText || props.node?.name || 'Product image',
      title: image?.title || props.node?.name || 'Product image',
      key: `gallery-${image?.databaseId || image?.sourceUrl}`,
      databaseId: image?.databaseId ?? null,
    });
  };

  const variations = props.node?.variations?.nodes || [];
  const gallery = props.node?.galleryImages?.nodes || [];
  const main = {
    src: mainImage.value,
    alt: props.node?.image?.altText || props.node?.name || 'Product image',
    title: props.node?.image?.title || props.node?.name || 'Product image',
    key: `main-${props.node?.image?.databaseId || mainImage.value}`,
    databaseId: props.node?.image?.databaseId ?? null,
  };

  if (paColor.value.length) {
    const matching = variations.filter((variation: ProductVariationFragment) => matchesSelectedColor(variation));
    if (matching.length) {
      if (matching.some((variation: ProductVariationFragment) => preferredSrc(variation?.image) === main.src)) {
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
  if (activeColorImage?.length) return preferredSrc(activeColorImage[0]?.image) || null;
  return null;
});

const activeImageIndex = computed<number>(() => {
  if (!activeVariationImageSrc.value) return 0;
  const index = sliderImages.value.findIndex((image) => image.src === activeVariationImageSrc.value);
  return Math.max(index, 0);
});

// Appends `img=<databaseId>` so the detail page opens showing the same photo that was visible on
// the card, not always its default/primary one — used both per-slide and for the title/"ver
// detalle" links, which point at whichever slide is currently in view.
const productLinkFor = (imageId?: number | null): string => {
  const baseUrl = `/product/${decodeURIComponent(props.node.slug || '')}`;
  const params = new URLSearchParams();
  if (paColor.value[0]) params.set('pa_color', paColor.value[0]);
  if (imageId != null) params.set('img', String(imageId));
  const query = params.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

const productLink = computed<string>(() => productLinkFor(sliderImages.value[currentSlide.value]?.databaseId));

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

// Only the current slide is ever actually on screen (the rest are scrolled out of view behind
// the snap-scroll), so whichever link inside the card was clicked — image, title or "ver
// detalle" — it's always this same image that should grow into the detail page's one.
const { capture } = useProductImageTransition();

const handleNavigateClick = () => {
  const container = sliderRef.value;
  const activeImage = sliderImages.value[currentSlide.value];
  if (!container || !activeImage) return;

  const activeImgEl = container.querySelector(`[data-index="${currentSlide.value}"] img`);
  capture(activeImage.src, activeImgEl);
};
</script>

<template>
  <div
    class="group relative flex flex-col justify-between overflow-hidden rounded-sm border border-[var(--color-sand)]/60 bg-[var(--color-cream)]/40 p-3 transition-all duration-500 ease-out hover:border-[var(--color-charcoal)]/30 hover:bg-[var(--color-cream)]/80 hover:shadow-lg">
    <!-- Contenedor Principal de Imagen con Slider -->
    <div class="relative block overflow-hidden rounded-sm">
      <!-- Badges de Estado (Oferta / Agotado) -->
      <!-- Top-right is a reserved corner: WishListItem.vue overlays its own remove button there
           (outside this component, since ProductCard has no slot for it) — keep status badges
           confined to top-left so a future one here doesn't collide. -->
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

      <!-- Slider de Imágenes: cuadrado + object-contain, igual que la ficha de producto, así la
           foto siempre se ve completa y con su propia proporción en ambos sitios. -->
      <div
        ref="sliderRef"
        class="no-slider flex gap-3 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x overscroll-x-contain overscroll-y-auto [-webkit-overflow-scrolling:touch]"
        @scroll.passive="updateCurrentSlide">
        <template v-for="(image, slideIndex) in sliderImages" :key="image.key">
          <NuxtLink
            v-if="node.slug"
            class="product-card-slide block flex-[0_0_100%] snap-start snap-always aspect-square overflow-hidden rounded-sm bg-[var(--color-cream)]"
            :data-index="slideIndex"
            :to="productLinkFor(image.databaseId)"
            @click="handleNavigateClick">
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
                class: 'object-contain object-center w-full h-full rounded-sm transition-transform duration-700 ease-out group-hover:scale-105',
                fetchpriority: slideIndex === 0 && isFirstProduct ? 'high' : undefined,
              }" />
          </NuxtLink>
          <div
            v-else
            class="product-card-slide block flex-[0_0_100%] snap-start snap-always aspect-square overflow-hidden rounded-sm bg-[var(--color-cream)]"
            :data-index="slideIndex">
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
                class: 'object-contain object-center w-full h-full rounded-sm transition-transform duration-700 ease-out group-hover:scale-105',
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
        class="absolute inset-x-0 bottom-0 z-10 flex translate-y-full transform items-center justify-center bg-gradient-to-t from-[var(--color-charcoal)]/50 to-transparent p-4 transition-transform duration-300 ease-in-out group-hover:translate-y-0"
        @click="handleNavigateClick">
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
        <NuxtLink v-if="node.slug" :to="productLink" :title="node.name || undefined" @click="handleNavigateClick">
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

      <div class="mt-3 flex items-baseline justify-center gap-1.5 border-t border-[var(--color-sand)]/40 pt-2.5">
        <ProductPrice
          class="font-sans text-sm font-semibold tracking-tight text-[var(--color-charcoal)]"
          :sale-price="node.salePrice ?? undefined"
          :regular-price="node.regularPrice ?? undefined" />
      </div>
    </div>
  </div>
</template>
