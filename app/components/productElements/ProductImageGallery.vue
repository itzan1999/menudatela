<script setup lang="ts">
import gsap from 'gsap';
import { StockStatusEnum } from '#gql/default';
import type { ImageFragment, Product, Variation } from '#types/gql';

const { FALLBACK_IMG } = useHelpers();
const { storeSettings } = useAppConfig();
const { resolve: resolveImageTransition, clear: clearImageTransition, hasPending: hasPendingImageTransition } = useProductImageTransition();

type Gallery = { nodes: ImageFragment[] };
type ThumbnailPosition = 'bottom' | 'left';

const props = defineProps({
  mainImage: { type: Object as PropType<ImageFragment>, required: true },
  gallery: { type: Object as PropType<Gallery>, required: true },
  node: { type: Object as PropType<Product | Variation>, required: true },
  activeVariation: { type: Object as PropType<Variation | null>, default: null },
  // Set when arriving from a listing card click, so the gallery can open on the same photo that
  // was showing there instead of always defaulting to the primary image.
  initialImageId: { type: Number as PropType<number | null>, default: null },
  // A listing card's slider also shows each color variation's own image, which isn't part of
  // this product's own gallery — needed so initialImageId can still resolve to one of those.
  variationImages: { type: Array as PropType<ImageFragment[]>, default: () => [] },
});

const isOutOfStock = computed(() => props.node?.stockStatus === StockStatusEnum.OutOfStock);

const primaryImage = computed<ImageFragment>(() => ({
  sourceUrl: props.mainImage.sourceUrl || FALLBACK_IMG,
  title: props.mainImage.title,
  altText: props.mainImage.altText,
  databaseId: props.mainImage.databaseId,
}));

const galleryImages = computed<ImageFragment[]>(() => {
  return [primaryImage.value, ...(props.gallery.nodes || [])].filter((img, index, self) => index === self.findIndex((t) => t?.databaseId === img?.databaseId));
});

const initialImage = computed<ImageFragment>(() => {
  if (props.initialImageId == null) return primaryImage.value;
  const inGallery = galleryImages.value.find((img) => img?.databaseId === props.initialImageId);
  const inVariations = props.variationImages.find((img) => img?.databaseId === props.initialImageId);
  return inGallery ?? inVariations ?? primaryImage.value;
});

const imageToShow = ref<ImageFragment>(initialImage.value);

// Read by onImageEnter/onImageLeave at the moment they actually fire, rather than captured in a
// closure per call — a plain variable is enough since, unlike the navbar's page transition, only
// one gallery image ever changes at a time (no cross-navigation staleness to guard against).
let slideDirection: 1 | -1 = 1;

// Thumbnail clicks / a variation's own photo don't carry an explicit direction — infer one from
// how the clicked image's position compares to the current one, so the slide still reads as
// "forward" or "back" instead of always sliding the same way.
const indexOf = (image: ImageFragment): number => galleryImages.value.findIndex((img) => img.databaseId === image.databaseId);

const changeImage = (image: ImageFragment, direction?: 1 | -1) => {
  if (!image || image.databaseId === imageToShow.value.databaseId) return;
  slideDirection = direction ?? (indexOf(image) >= indexOf(imageToShow.value) ? 1 : -1);
  imageToShow.value = image;
};

const changeImageByOffset = (offset: number) => {
  const images = galleryImages.value;
  if (images.length <= 1) return false;

  const currentIndex = images.findIndex((image) => image.databaseId === imageToShow.value.databaseId);
  const fallbackIndex = offset > 0 ? 0 : images.length - 1;
  const nextIndex = currentIndex === -1 ? fallbackIndex : (currentIndex + offset + images.length) % images.length;
  const nextImage = images[nextIndex];
  if (nextImage) {
    // Explicit, rather than inferred from indices: wrapping from the last image back to the
    // first is still "next" as far as the arrow the user clicked is concerned, even though the
    // index itself goes down.
    changeImage(nextImage, offset > 0 ? 1 : -1);
    return true;
  }
  return false;
};

const SLIDE_DURATION = 0.4;

const onImageEnter = (el: Element, done: () => void) => {
  if (prefersReducedMotion()) {
    done();
    return;
  }
  gsap.fromTo(el, { xPercent: slideDirection * 100 }, { xPercent: 0, duration: SLIDE_DURATION, ease: 'power2.out', onComplete: done });
};

const onImageLeave = (el: Element, done: () => void) => {
  if (prefersReducedMotion()) {
    done();
    return;
  }
  gsap.to(el, { xPercent: slideDirection * -100, duration: SLIDE_DURATION, ease: 'power2.out', onComplete: done });
};

watch(
  () => props.activeVariation,
  (newVal) => {
    if (newVal?.image) {
      const foundImage = galleryImages.value.find((img) => img.sourceUrl && img.sourceUrl === newVal.image?.sourceUrl);
      if (foundImage) changeImage(foundImage);
    }
  },
);

const imgWidth = 640;

const thumbnailPosition = computed<ThumbnailPosition>(() => (storeSettings.productGalleryThumbnailsPosition === 'left' ? 'left' : 'bottom'));
const showLeftThumbnails = computed(() => thumbnailPosition.value === 'left');

const galleryRootClasses = computed(() => [
  'w-full min-w-0',
  { 'lg:grid lg:grid-cols-[88px_minmax(0,1fr)] lg:items-start lg:gap-4': showLeftThumbnails.value },
]);

const thumbnailListClasses = computed(() => [
  'mt-4 flex gap-3 overflow-auto scrollbar-none p-1 [&::-webkit-scrollbar]:hidden',
  showLeftThumbnails.value ? 'lg:order-first lg:mt-0 lg:max-h-[min(640px,calc(100vh-160px))] lg:w-24 lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto' : '',
]);

const thumbnailButtonClasses = (galleryImg: ImageFragment) => [
  'size-20 shrink-0 overflow-hidden bg-[var(--color-cream)] border transition cursor-pointer',
  showLeftThumbnails.value ? 'lg:size-22' : '',
  galleryImg.databaseId === imageToShow.value.databaseId
    ? 'border-[var(--color-charcoal)]'
    : 'border-[var(--color-sand)] hover:border-[var(--color-charcoal)]/50',
];

const mainImageBoxEl = ref<HTMLElement | null>(null);
// Stays true (image shown right away) for a normal page load; only goes false when arriving via
// a card's zoom-in, so the real image doesn't sit there fully visible while the flying copy is
// still on its way to the same spot. No transition on the reveal itself: by the time it happens
// the flying copy is already sitting exactly on top of this same image, so the swap is a no-op
// visually — a fade here would only re-introduce a gap (of dimmed image) of its own.
const imageRevealed = ref(true);

onMounted(async () => {
  const willAnimate = hasPendingImageTransition();
  if (willAnimate) imageRevealed.value = false;
  await resolveImageTransition(mainImageBoxEl.value);
  // Reveal the real image *before* the flying copy is removed — otherwise there's a frame where
  // neither is visible (the removal happens synchronously inside GSAP's onComplete, a whole
  // microtask before this `await` continuation runs), which shows as a flicker.
  imageRevealed.value = true;
  clearImageTransition();
});
</script>

<template>
  <div :class="galleryRootClasses">
    <div ref="mainImageBoxEl" class="relative group aspect-square w-full min-w-0 overflow-hidden bg-[var(--color-cream)] border border-[var(--color-sand)]">
      <div class="absolute top-3 left-3 z-10 flex flex-col items-start gap-1">
        <SaleBadge :node />
        <span
          v-if="isOutOfStock"
          class="inline-block border-2 border-charcoal bg-stone-300 px-2.5 py-1 font-sans text-[10px] font-semibold tracking-widest uppercase text-charcoal">
          {{ $t('shop.outOfStock') }}
        </span>
      </div>
      <Transition :css="false" @enter="onImageEnter" @leave="onImageLeave">
        <div :key="imageToShow.databaseId" class="absolute inset-0">
          <NuxtPicture
            :width="imgWidth"
            :height="imgWidth"
            sizes="412px:100vw sm:100vw md:50vw lg:50vw xl:640px"
            :alt="imageToShow.altText || node.name"
            :title="imageToShow.title || node.name"
            :src="imageToShow.sourceUrl || FALLBACK_IMG"
            :preload="{ fetchPriority: 'high' }"
            :img-attrs="{ class: ['h-full w-full object-contain', imageRevealed ? 'opacity-100' : 'opacity-0'] }" />
        </div>
      </Transition>

      <button
        v-if="galleryImages.length > 1"
        class="absolute left-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center border border-[var(--color-sand)] bg-[var(--color-cream)]/90 text-[var(--color-charcoal)] opacity-0 transition-opacity hover:bg-[var(--color-cream)] group-hover:opacity-100 cursor-pointer"
        type="button"
        :aria-label="$t('shop.previousImageFor', { name: node.name })"
        @click="changeImageByOffset(-1)">
        <Icon name="ion:chevron-back-outline" size="20" />
      </button>

      <button
        v-if="galleryImages.length > 1"
        class="absolute right-3 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center border border-[var(--color-sand)] bg-[var(--color-cream)]/90 text-[var(--color-charcoal)] opacity-0 transition-opacity hover:bg-[var(--color-cream)] group-hover:opacity-100 cursor-pointer"
        type="button"
        :aria-label="$t('shop.nextImageFor', { name: node.name })"
        @click="changeImageByOffset(1)">
        <Icon name="ion:chevron-forward-outline" size="20" />
      </button>
    </div>

    <div v-if="gallery.nodes.length" :class="thumbnailListClasses">
      <button
        v-for="galleryImg in galleryImages"
        :key="galleryImg.databaseId"
        :class="thumbnailButtonClasses(galleryImg)"
        type="button"
        :aria-label="$t('shop.showImageFor', { name: node.name })"
        :aria-pressed="galleryImg.databaseId === imageToShow.databaseId"
        @click="changeImage(galleryImg)">
        <NuxtPicture
          :width="160"
          :height="160"
          :src="galleryImg.sourceUrl || FALLBACK_IMG"
          :alt="galleryImg.altText || node.name"
          loading="lazy"
          :img-attrs="{ class: 'h-full w-full object-cover' }" />
      </button>
    </div>
  </div>
</template>
