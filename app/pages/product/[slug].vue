<script lang="ts" setup>
import { StockStatusEnum, ProductTypesEnum, type AddToCartInput, type ProductAttributeInput } from '#gql/default';
import type { ExternalProduct, ProductDetail, Variation, VariationAttribute } from '#types/gql';

const route = useRoute();
const { storeSettings } = useAppConfig();
const { addToCart, isUpdatingCart, isAddingToCart, isOptimisticCartMode } = useCart();
const { frontEndUrl, getErrorMessage } = useHelpers();
const { t } = useI18n();
const gql = useWooGraphQL();
const slug = route.params.slug as string;

const { data, error } = await useAsyncGql('getProduct', { slug, frontEndUrl });
const product = ref<ProductDetail | null>(data.value?.product ?? null);
const quantity = ref<number>(1);
const activeVariation = ref<Variation | null>(null);
const variation = ref<VariationAttribute[]>([]);
const attrValues = ref<ProductAttributeInput[]>([]);

const productLoadError = error.value
  ? getErrorMessage(error.value) || `We couldn't load "${slug}" right now. Please refresh and try again.`
  : t('shop.productNotFound');

const normalizeMatchToken = (value?: string | null): string =>
  (value ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-_]+/g, '');

const stripPaPrefix = (value?: string | null): string => (value ?? '').toString().replace(/^pa[_-]/i, '');

const normalizeMatchKey = (value?: string | null): string => normalizeMatchToken(stripPaPrefix(value));
const normalizeMatchValue = (value?: string | null): string => normalizeMatchToken(value);
type VariationSelection = Pick<VariationAttribute, 'name' | 'value'>;

const toSelectionName = (name?: string | null): string => {
  if (!name) return '';
  return name.charAt(0).toLowerCase() + name.slice(1);
};

const normalizedVariations = computed(() => {
  const nodes = product.value?.variations?.nodes ?? [];
  return nodes.map((node: Variation) => {
    const attrs: Record<string, string> = {};
    node.attributes?.nodes?.forEach((attr) => {
      const key = normalizeMatchKey(attr.name);
      if (!key) return;
      attrs[key] = normalizeMatchValue(attr.value);
    });

    const specificity = Object.values(attrs).filter(Boolean).length;
    return { variation: node, attrs, specificity };
  });
});

const findMatchingVariation = (selected: VariationSelection[]): Variation | null => {
  if (!selected?.length) return null;

  const selectedMap: Record<string, string> = {};
  selected.forEach((attr) => {
    const key = normalizeMatchKey(attr.name);
    if (!key) return;
    const value = normalizeMatchValue(attr.value);
    if (!value) return;
    selectedMap[key] = value;
  });

  if (Object.keys(selectedMap).length === 0) return null;

  let bestMatch: { variation: Variation; score: number } | null = null;

  for (const candidate of normalizedVariations.value) {
    let matches = true;
    let matchedSpecific = 0;

    for (const [key, value] of Object.entries(selectedMap)) {
      const candidateValue = candidate.attrs[key];
      if (!candidateValue) continue;
      if (candidateValue !== value) {
        matches = false;
        break;
      }
      matchedSpecific += 1;
    }

    if (!matches) continue;

    const score = matchedSpecific * 100 + candidate.specificity;
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { variation: candidate.variation, score };
    }
  }

  return bestMatch?.variation ?? null;
};

const queryParams = route.query;

const findVariationById = (value?: string | number | null): Variation | null => {
  if (!value || !product.value?.variations?.nodes?.length) return null;
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  if (!parsed || Number.isNaN(parsed)) return null;
  return product.value?.variations?.nodes?.find((node: Variation) => node.databaseId === parsed) ?? null;
};

const buildQuerySelections = (): VariationSelection[] => {
  if (!product.value?.attributes?.nodes?.length) return [];

  const selections: VariationSelection[] = [];
  for (const attr of product.value.attributes.nodes) {
    const key = toSelectionName(attr?.name);
    if (!key) continue;

    const rawQueryValue = queryParams[key];
    if (!rawQueryValue) continue;

    const value = Array.isArray(rawQueryValue) ? rawQueryValue[0] : rawQueryValue;
    const normalizedValue = normalizeMatchValue(value);
    if (!normalizedValue) continue;

    const isValidValue =
      attr.scope === 'LOCAL'
        ? (attr.options ?? []).some((option: string | null) => normalizeMatchValue(option ?? '') === normalizedValue)
        : 'terms' in attr && (attr.terms?.nodes ?? []).some((term) => normalizeMatchValue(term?.slug ?? '') === normalizedValue);

    if (!isValidValue) continue;

    selections.push({
      name: key,
      value: String(value),
    });
  }

  return selections;
};

const queryVariationId = queryParams.variationId ?? queryParams.variation;
const variationFromQuery = findVariationById(Array.isArray(queryVariationId) ? queryVariationId[0] : queryVariationId);

if (variationFromQuery?.attributes?.nodes?.length) {
  variation.value = variationFromQuery.attributes.nodes.map((attr: VariationAttribute) => ({
    name: attr.name || '',
    value: attr.value || '',
    attributeId: attr.attributeId ?? null,
    label: attr.label ?? attr.name ?? '',
  }));
  activeVariation.value = variationFromQuery;
} else {
  const initialSelections = buildQuerySelections();
  if (initialSelections.length > 0) {
    const matched = findMatchingVariation(initialSelections);
    if (matched?.attributes?.nodes?.length) {
      variation.value = matched.attributes.nodes.map((attr: VariationAttribute) => ({
        name: attr.name || '',
        value: attr.value || '',
        attributeId: attr.attributeId ?? null,
        label: attr.label ?? attr.name ?? '',
      }));
      activeVariation.value = matched;
    } else {
      variation.value = initialSelections.map((selection) => ({
        name: selection.name || '',
        value: selection.value || '',
        attributeId: null,
        label: selection.name || '',
      }));
    }
  }
}

const defaultAttributes = computed<{ nodes: VariationAttribute[] } | null>(() => {
  if (variation.value.length > 0) {
    return { nodes: variation.value };
  }
  return product.value?.defaultAttributes ? { nodes: product.value.defaultAttributes.nodes ?? [] } : null;
});

const isSimpleProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.Simple);
const isVariableProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.Variable);
const isExternalProduct = computed<boolean>(() => product.value?.type === ProductTypesEnum.External);
const externalProduct = computed<ExternalProduct | null>(() => (isExternalProduct.value ? (product.value as ExternalProduct) : null));
const shouldSkipStockRefresh = computed<boolean>(() => isExternalProduct.value);

const displayProduct = computed<ProductDetail | Variation>(() => activeVariation.value || product.value!);
const priceTarget = computed<ProductDetail | Variation>(() => activeVariation.value || product.value!);
const productImage = computed(() => product.value?.image || null);
const productGallery = computed(() => ({ nodes: product.value?.galleryImages?.nodes ?? [] }));
const averageRating = computed(() => product.value?.averageRating ?? 0);
const reviewCount = computed(() => product.value?.reviewCount ?? 0);

const selectProductInput = computed<AddToCartInput>(() => {
  const input: AddToCartInput = {
    productId: displayProduct.value.databaseId,
    quantity: quantity.value,
  };

  if (activeVariation.value) input.variationId = activeVariation.value.databaseId;
  else if (attrValues.value.length) input.variation = attrValues.value;

  return input;
});

const handleAddToCart = (): void => {
  if (!product.value) return;
  void addToCart(selectProductInput.value, { product: product.value, variation: activeVariation.value });
};

const updateSelectedVariations = (variations: VariationAttribute[]): void => {
  if (!product.value?.variations) return;

  attrValues.value = variations.map((el) => ({ attributeName: el.name || '', attributeValue: el.value }));
  activeVariation.value = findMatchingVariation(variations);
  variation.value = variations;

  if (import.meta.client) {
    const query: Record<string, string> = {};
    variations.forEach((v) => {
      if (v.name && v.value) {
        query[v.name] = v.value;
      }
    });
    if (activeVariation.value?.databaseId) {
      query.variationId = String(activeVariation.value.databaseId);
    }

    const url = new URL(window.location.href);
    url.search = new URLSearchParams(query).toString();
    window.history.replaceState({ ...window.history.state }, '', url.toString());
  }
};

const mergeLiveStockStatus = (payload: ProductDetail): void => {
  if (product.value) {
    product.value = {
      ...product.value,
      stockStatus: payload.stockStatus ?? product.value.stockStatus,
      variations: product.value.variations
        ? {
            ...product.value.variations,
            nodes:
              product.value.variations.nodes?.map((node, index) => ({
                ...node,
                stockStatus: payload.variations?.nodes?.[index]?.stockStatus || node.stockStatus,
              })) ?? [],
          }
        : undefined,
    };
  }
};

const refreshStockStatus = async (): Promise<void> => {
  try {
    const { product } = await gql.getStockStatus({ slug });
    if (product) mergeLiveStockStatus(product as ProductDetail);
  } catch (error: any) {
    const errorMessage = error?.gqlErrors?.[0]?.message;
    if (errorMessage) console.error(errorMessage);
  }
};

onMounted(() => {
  if (!shouldSkipStockRefresh.value) void refreshStockStatus();
});

const stockStatus = computed(() => {
  if (isVariableProduct.value) {
    return activeVariation.value?.stockStatus ?? product.value?.stockStatus ?? StockStatusEnum.OutOfStock;
  }
  return product.value?.stockStatus ?? StockStatusEnum.OutOfStock;
});

const isOutOfStock = computed(() => stockStatus.value === StockStatusEnum.OutOfStock);

const disabledAddToCart = computed(() => {
  const canPurchaseWithCurrentStock = stockStatus.value === StockStatusEnum.InStock || stockStatus.value === StockStatusEnum.OnBackorder;
  const isInvalidType = !displayProduct.value;
  const isCartUpdating = isOptimisticCartMode.value ? false : isUpdatingCart.value || isAddingToCart.value;
  const hasValidVariation = !isVariableProduct.value || !!activeVariation.value;
  return !canPurchaseWithCurrentStock || isCartUpdating || !hasValidVariation || isInvalidType;
});

const addToCartLoading = computed(() => (isOptimisticCartMode.value ? false : isUpdatingCart.value));
</script>

<template>
  <main class="container relative py-8 xl:max-w-7xl">
    <div v-if="product">
      <SEOHead :info="product" />
      <Breadcrumb v-if="storeSettings.showBreadcrumbOnSingleProduct" :product class="mb-8" />

      <div class="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,34rem)] lg:gap-16">
        <ProductImageGallery
          v-if="productImage"
          class="relative w-full min-w-0"
          :main-image="productImage"
          :gallery="productGallery"
          :node="displayProduct"
          :active-variation="activeVariation" />
        <NuxtImg
          v-else
          class="relative aspect-square w-full min-w-0 rounded-none object-contain skeleton bg-[var(--color-cream)]"
          src="/images/placeholder.jpg"
          :alt="product?.name || $t('shop.product')" />

        <div class="w-full min-w-0 md:py-2">
          <!-- Hook: Before product title -->
          <HookOutlet name="product.summary.beforeTitle" :ctx="{ product: displayProduct }" as="div" />

          <!-- Badges de Estado (Oferta y Agotado) -->
          <div v-if="displayProduct?.onSale" class="mb-3">
            <SaleBadge :node="displayProduct" />
          </div>

          <div class="flex flex-col gap-2 mb-6">
            <div class="flex items-baseline justify-between gap-4">
              <h1 class="font-serif text-3xl md:text-4xl text-[var(--color-charcoal)] leading-tight">
                {{ displayProduct.name }}

                <!-- Editar producto WP (admin) -->
                <!-- <LazyWPAdminLink :link="`/wp-admin/post.php?post=${product.databaseId}&action=edit`" class="inline-block ml-2 align-middle"
                  >Edit</LazyWPAdminLink
                > -->
              </h1>
              <div class="flex items-baseline whitespace-nowrap">
                <ProductPrice
                  class="text-2xl font-serif text-[var(--color-charcoal)]"
                  :sale-price="priceTarget?.salePrice"
                  :regular-price="priceTarget?.regularPrice" />
                <span class="ml-1 font-sans text-xs uppercase tracking-wider text-[var(--color-charcoal)]/60">{{ $t('shop.perMeter') }}</span>
              </div>
            </div>

            <StarRating v-if="storeSettings.showReviews" :rating="averageRating" :count="reviewCount" />
          </div>

          <!-- Hook: After product price -->
          <HookOutlet name="product.summary.afterPrice" :ctx="{ product: displayProduct }" as="div" />

          <div class="flex items-center gap-6 my-6 font-sans text-xs uppercase tracking-wider text-[var(--color-charcoal)]/70">
            <div v-if="!isExternalProduct" class="flex items-center gap-2">
              <span>{{ $t('shop.availability') }}:</span>
              <StockStatus :stock-status="stockStatus" />
            </div>
            <div v-if="storeSettings.showSKU && product?.sku" class="flex items-center gap-2">
              <span>{{ $t('shop.sku') }}:</span>
              <span class="font-medium text-[var(--color-charcoal)]">{{ product?.sku || 'N/A' }}</span>
            </div>
          </div>

          <div
            class="mb-8 font-sans text-sm leading-relaxed text-[var(--color-charcoal)]/80 prose"
            v-html="product.shortDescription || product.description"></div>

          <hr class="border-[var(--color-sand)]/60 my-6" />

          <form @submit.prevent="handleAddToCart">
            <AttributeSelections
              v-if="isVariableProduct && product?.attributes?.nodes?.length && product?.variations"
              class="mt-4 mb-8"
              :attributes="product.attributes.nodes"
              :default-attributes="defaultAttributes"
              :variations="product.variations.nodes"
              @attrs-changed="updateSelectedVariations" />

            <div
              v-if="isVariableProduct || isSimpleProduct"
              class="fixed bottom-0 left-0 z-10 flex items-center w-full gap-3 p-4 bg-[var(--color-cream)] border-t border-[var(--color-sand)] shadow-lg md:static md:bg-transparent md:p-0 md:shadow-none md:border-t-0 md:mt-8">
              <!-- Selector de Cantidad Minimalista -->
              <div class="flex items-center border border-[var(--color-sand)] bg-[var(--color-cream)] text-[var(--color-charcoal)]">
                <button
                  type="button"
                  class="px-3 py-2 text-sm hover:bg-[var(--color-sand)]/30 transition-colors cursor-pointer"
                  @click="quantity = Math.max(1, quantity - 1)">
                  -
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  aria-label="Cantidad"
                  class="w-12 text-center bg-transparent py-2 font-sans text-xs font-semibold text-[var(--color-charcoal)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button type="button" class="px-3 py-2 text-sm hover:bg-[var(--color-sand)]/30 transition-colors cursor-pointer" @click="quantity++">+</button>
              </div>

              <!-- Botón Estilo Filtro (Borde claro como los filtros) -->
              <button
                type="submit"
                :disabled="disabledAddToCart"
                class="flex-1 border border-[var(--color-sand)] bg-transparent py-3 px-6 font-sans text-xs font-semibold tracking-widest uppercase text-[var(--color-charcoal)] transition-all duration-300 hover:border-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-charcoal)] disabled:hover:border-[var(--color-sand)] cursor-pointer flex items-center justify-center gap-2">
                <Icon v-if="addToCartLoading" name="ion:load-a" class="animate-spin h-4 w-4" />
                <span>{{ $t('shop.addToCart') }}</span>
              </button>
            </div>

            <a
              v-if="externalProduct?.externalUrl"
              :href="externalProduct.externalUrl"
              target="_blank"
              class="border border-[var(--color-sand)] bg-transparent py-3 px-6 font-sans text-xs font-semibold tracking-widest uppercase text-[var(--color-charcoal)] transition-all duration-300 hover:border-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] flex items-center justify-center gap-2">
              {{ externalProduct?.buttonText || 'View product' }}
            </a>
          </form>

          <div v-if="storeSettings.showProductCategoriesOnSingleProduct && product.productCategories" class="mt-8">
            <div class="flex items-center gap-2 font-sans text-xs uppercase tracking-wider text-[var(--color-charcoal)]/60">
              <span>{{ $t('shop.category', 2) }}:</span>
              <div class="product-categories text-[var(--color-charcoal)] font-medium">
                <NuxtLink
                  v-for="category in product.productCategories.nodes"
                  :key="category.databaseId"
                  :to="`/product-category/${decodeURIComponent(category?.slug || '')}`"
                  class="hover:underline"
                  :title="category.name || ''"
                  >{{ category.name }}<span class="comma">, </span>
                </NuxtLink>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-6 mt-8 pt-6 border-t border-[var(--color-sand)]/60">
            <WishlistButton :product />
            <ShareButton :product />
          </div>
        </div>
      </div>

      <!-- Sección de Descripción y Reseñas en Acordeón -->
      <div v-if="product.description || product.reviews" class="mt-20 border-t border-[var(--color-sand)]">
        <ProductTabs :product />
        <HookOutlet name="product.tabs.after" :ctx="{ product }" as="div" />
      </div>

      <div v-if="product.related && storeSettings.showRelatedProducts" class="mt-24 border-t border-[var(--color-sand)] pt-12">
        <div class="mb-8 font-serif text-2xl text-[var(--color-charcoal)] text-center">{{ $t('shop.youMayLike') }}</div>
        <LazyProductRow :products="product.related.nodes" class="grid-cols-2 md:grid-cols-4 lg:grid-cols-5" />
      </div>
    </div>
    <div v-else class="my-24 text-center text-gray-500">
      {{ productLoadError }}
    </div>
  </main>
</template>

<style scoped>
.product-categories > a:last-child .comma {
  display: none;
}
</style>
