<script lang="ts" setup>
import { StockStatusEnum, ProductTypesEnum, type AddToCartInput, type ProductAttributeInput } from '#gql/default';
import type { ExternalProduct, ProductDetail, Variation, VariationAttribute } from '#types/gql';

const route = useRoute();
const { storeSettings } = useAppConfig();
const { cart, addToCart, removeItem, updateItemQuantity, isUpdatingCart, isAddingToCart, isOptimisticCartMode } = useCart();
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

// Whether the currently-displayed product/variation is already in the cart, and, if so, which
// cart line it corresponds to (needed to target updateItemQuantity/removeItem by cart item key).
const cartItem = computed(() => {
  const nodes = cart.value?.contents?.nodes ?? [];
  if (isVariableProduct.value) {
    const variationId = activeVariation.value?.databaseId;
    if (!variationId) return null;
    return nodes.find((node) => node.variation?.node?.databaseId === variationId) ?? null;
  }
  const productId = product.value?.databaseId;
  if (!productId) return null;
  return nodes.find((node) => !node.variation?.node && node.product?.node?.databaseId === productId) ?? null;
});

const isInCart = computed(() => !!cartItem.value);
const cartItemQuantity = computed(() => cartItem.value?.quantity ?? 0);
const quantityMatchesCart = computed(() => isInCart.value && quantity.value === cartItemQuantity.value);

// Tracks whether the user has touched the quantity field since it was last synced from the cart,
// so we know whether to keep defaulting it to the cart's quantity or leave the user's edit alone.
const userEditedQuantity = ref(false);

watch(
  cartItem,
  (item) => {
    if (userEditedQuantity.value) return;
    quantity.value = item?.quantity ?? 1;
  },
  { immediate: true },
);

// Switching variation targets a different (or no) cart line, so the quantity field should default
// again from that new target's cart quantity instead of keeping whatever was typed for the old one.
watch(activeVariation, () => {
  userEditedQuantity.value = false;
});

const onQuantityChanged = (): void => {
  userEditedQuantity.value = true;
};

const decrementQuantity = (): void => {
  quantity.value = Math.max(1, quantity.value - 1);
  onQuantityChanged();
};

const incrementQuantity = (): void => {
  quantity.value++;
  onQuantityChanged();
};

const primaryActionLoading = computed(() => (isOptimisticCartMode.value ? false : isUpdatingCart.value || isAddingToCart.value));

const primaryActionLabel = computed(() => {
  if (isOutOfStock.value) return t('shop.outOfStockAction');
  if (!isInCart.value) return t('shop.addToCart');
  return quantityMatchesCart.value ? t('shop.inCart') : t('shop.updateQuantity');
});

const handleAddToCart = (): void => {
  if (!product.value) return;
  void addToCart(selectProductInput.value, { product: product.value, variation: activeVariation.value });
  userEditedQuantity.value = false;
};

const handleUpdateQuantity = async (): Promise<void> => {
  if (!cartItem.value) return;
  await updateItemQuantity(cartItem.value.key, quantity.value);
  userEditedQuantity.value = false;
};

const handleRemoveFromCart = async (): Promise<void> => {
  if (!cartItem.value) return;
  await removeItem(cartItem.value.key);
  userEditedQuantity.value = false;
  quantity.value = 1;
};

// Collapses/expands the "remove from cart" button smoothly instead of it popping in/out. The
// target width is a fixed constant (matching the button's own w-11 Tailwind class) rather than
// measured live via getBoundingClientRect: the icon inside it (`ion:trash-outline`) is loaded
// asynchronously by @nuxt/icon, so a measurement taken before the icon has finished loading
// under-reports the button's true resting width. That under-measurement made the animation
// visibly stall partway through and then jump to the real size once the icon finally loaded —
// a fixed, known target sidesteps the race entirely.
const REMOVE_BTN_WIDTH_PX = 42; // Matches the w-[42px] class on .remove-from-cart-btn below (same height as the primary button).
// Border-width was tried and dropped: with box-sizing: border-box, a real 1px border keeps
// rendering right up until the browser's pixel-snapping rounds it away, so it doesn't fade
// smoothly like width/opacity do — it jumps from 1px to 0 in a single frame near the very end.
// The button's border is drawn with an inset box-shadow instead (see the template class below),
// which doesn't take up any box-model space, so there's no border contribution to collapse at all.
const REMOVE_BTN_TRANSITION = 'width 0.25s ease, opacity 0.2s ease, margin-left 0.25s ease';

const onRemoveBtnTransitionEnd = (button: HTMLElement, done: () => void) => {
  const handler = (event: TransitionEvent): void => {
    if (event.target !== button || event.propertyName !== 'width') return;
    button.removeEventListener('transitionend', handler);
    done();
  };
  button.addEventListener('transitionend', handler);
};

const onRemoveBtnBeforeEnter = (el: Element): void => {
  const button = el as HTMLElement;
  button.style.transition = 'none';
  button.style.overflow = 'hidden';
  button.style.width = '0px';
  button.style.opacity = '0';
  button.style.marginLeft = '0px';
};

const onRemoveBtnEnter = (el: Element, done: () => void): void => {
  const button = el as HTMLElement;
  requestAnimationFrame(() => {
    button.style.transition = REMOVE_BTN_TRANSITION;
    button.style.width = `${REMOVE_BTN_WIDTH_PX}px`;
    button.style.opacity = '1';
    button.style.marginLeft = '';
  });

  onRemoveBtnTransitionEnd(button, () => {
    button.style.width = '';
    button.style.overflow = '';
    button.style.transition = '';
    done();
  });
};

const onRemoveBtnLeave = (el: Element, done: () => void): void => {
  const button = el as HTMLElement;
  button.style.width = `${REMOVE_BTN_WIDTH_PX}px`;
  button.style.overflow = 'hidden';
  void button.offsetWidth; // Force a reflow so the explicit width is committed before animating away from it.

  requestAnimationFrame(() => {
    button.style.transition = REMOVE_BTN_TRANSITION;
    button.style.width = '0px';
    button.style.opacity = '0';
    button.style.marginLeft = '0px';
  });

  onRemoveBtnTransitionEnd(button, done);
};

const handlePrimaryAction = (): void => {
  if (!isInCart.value) {
    handleAddToCart();
    return;
  }
  if (quantityMatchesCart.value) return;
  void handleUpdateQuantity();
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
  } catch (error) {
    const errorMessage = (error as { gqlErrors?: { message?: string }[] })?.gqlErrors?.[0]?.message;
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
  const nothingToSubmit = isInCart.value && quantityMatchesCart.value;
  return !canPurchaseWithCurrentStock || isCartUpdating || !hasValidVariation || isInvalidType || nothingToSubmit;
});
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

          <form @submit.prevent="handlePrimaryAction">
            <AttributeSelections
              v-if="isVariableProduct && product?.attributes?.nodes?.length && product?.variations"
              class="mt-4 mb-8"
              :attributes="product.attributes.nodes"
              :default-attributes="defaultAttributes"
              :variations="product.variations.nodes"
              @attrs-changed="updateSelectedVariations" />

            <div
              v-if="isVariableProduct || isSimpleProduct"
              class="fixed bottom-0 left-0 z-10 flex items-center w-full p-4 bg-[var(--color-cream)] border-t border-[var(--color-sand)] shadow-lg md:static md:bg-transparent md:p-0 md:shadow-none md:border-t-0 md:mt-8">
              <!-- Selector de Cantidad Minimalista -->
              <div class="flex items-center mr-3 border border-[var(--color-sand)] bg-[var(--color-cream)] text-[var(--color-charcoal)]">
                <button type="button" class="px-3 py-2 text-sm hover:bg-[var(--color-sand)]/30 transition-colors cursor-pointer" @click="decrementQuantity">
                  -
                </button>
                <input
                  v-model.number="quantity"
                  type="number"
                  min="1"
                  aria-label="Cantidad"
                  class="w-12 text-center bg-transparent py-2 font-sans text-xs font-semibold text-[var(--color-charcoal)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  @input="onQuantityChanged" />
                <button type="button" class="px-3 py-2 text-sm hover:bg-[var(--color-sand)]/30 transition-colors cursor-pointer" @click="incrementQuantity">
                  +
                </button>
              </div>

              <!-- Botón Estilo Filtro (Borde claro como los filtros) -->
              <button
                type="submit"
                :disabled="disabledAddToCart"
                class="flex-1 border border-[var(--color-sand)] bg-transparent py-3 px-6 font-sans text-xs font-semibold tracking-widest uppercase text-[var(--color-charcoal)] transition-all duration-300 hover:border-[var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--color-charcoal)] disabled:hover:border-[var(--color-sand)] cursor-pointer disabled:cursor-default flex items-center justify-center gap-2">
                <Icon v-if="primaryActionLoading" name="ion:load-a" class="animate-spin h-4 w-4" />
                <Icon v-else-if="isInCart && quantityMatchesCart" name="ion:checkmark" class="h-4 w-4" />
                <span>{{ primaryActionLabel }}</span>
              </button>

              <!-- Pequeño botón para eliminar el producto del carrito -->
              <Transition
                :css="false"
                @before-enter="(el) => onRemoveBtnBeforeEnter(el)"
                @enter="(el, done) => onRemoveBtnEnter(el, done)"
                @leave="(el, done) => onRemoveBtnLeave(el, done)">
                <button
                  v-if="isInCart"
                  type="button"
                  :disabled="primaryActionLoading"
                  :aria-label="$t('shop.removeFromCart')"
                  :title="$t('shop.removeFromCart')"
                  class="remove-from-cart-btn shrink-0 w-[42px] h-[42px] ml-3 shadow-[inset_0_0_0_1px_var(--color-sand)] bg-transparent text-[var(--color-charcoal)] transition-all duration-300 hover:shadow-[inset_0_0_0_1px_var(--color-charcoal)] hover:bg-[var(--color-charcoal)] hover:text-[var(--color-cream)] disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center"
                  @click="handleRemoveFromCart">
                  <Icon name="ion:trash-outline" class="h-4 w-4 shrink-0" />
                </button>
              </Transition>
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

/* The "remove from cart" button's enter/leave animation is driven entirely by the JS transition
   hooks (onRemoveBtnBeforeEnter/Enter/Leave) in the script block, which measure the button's real
   rendered width and animate that exact pixel value via inline styles — see the comment there for
   why a CSS-only max-width/grid-track guess isn't used instead. */
</style>
