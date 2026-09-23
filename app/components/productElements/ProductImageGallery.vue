<script setup lang="ts">
import type { ImageFragment, Product, Variation } from '#types/gql';

const { FALLBACK_IMG } = useHelpers();
const { storeSettings } = useAppConfig();

type Gallery = { nodes: ImageFragment[] };
type ThumbnailPosition = 'bottom' | 'left';

const props = defineProps({
  mainImage: { type: Object as PropType<ImageFragment>, required: true },
  gallery: { type: Object as PropType<Gallery>, required: true },
  node: { type: Object as PropType<Product | Variation>, required: true },
  activeVariation: { type: Object as PropType<Variation | null>, default: null },
});

const primaryImage = computed<ImageFragment>(() => ({
  sourceUrl: props.mainImage.sourceUrl || FALLBACK_IMG,
  title: props.mainImage.title,
  altText: props.mainImage.altText,
  databaseId: props.mainImage.databaseId,
}));

const imageToShow = ref<ImageFragment>(primaryImage.value);

const galleryImages = computed<ImageFragment[]>(() => {
  return [primaryImage.value, ...(props.gallery.nodes || [])].filter((img, index, self) => index === self.findIndex((t) => t?.databaseId === img?.databaseId));
});

const changeImage = (image: ImageFragment) => {
  if (image) imageToShow.value = image;
};

const changeImageByOffset = (offset: number) => {
  const images = galleryImages.value;
  if (images.length <= 1) return false;

  const currentIndex = images.findIndex((image) => image.databaseId === imageToShow.value.databaseId);
  const fallbackIndex = offset > 0 ? 0 : images.length - 1;
  const nextIndex = currentIndex === -1 ? fallbackIndex : (currentIndex + offset + images.length) % images.length;
  const nextImage = images[nextIndex];
  if (nextImage) {
    changeImage(nextImage);
    return true;
  }
  return false;
};

watch(
  () => props.activeVariation,
  (newVal) => {
    if (newVal?.image) {
      const foundImage = galleryImages.value.find((img) => img.sourceUrl && img.sourceUrl === newVal.image?.sourceUrl);
      if (foundImage) imageToShow.value = foundImage;
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
</script>

<template>
  <div :class="galleryRootClasses">
    <div class="relative group aspect-square w-full min-w-0 overflow-hidden bg-[var(--color-cream)] border border-[var(--color-sand)]">
      <SaleBadge :node class="absolute top-3 left-3 z-10" />
      <NuxtPicture
        :width="imgWidth"
        :height="imgWidth"
        sizes="412px:100vw sm:100vw md:50vw lg:50vw xl:640px"
        :alt="imageToShow.altText || node.name"
        :title="imageToShow.title || node.name"
        :src="imageToShow.sourceUrl || FALLBACK_IMG"
        :preload="{ fetchPriority: 'high' }"
        :img-attrs="{ class: 'h-full w-full object-cover' }" />

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
