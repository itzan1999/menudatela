<script setup>
const { updateItemQuantity } = useCart();
const { addToWishlist } = useWishlist();
const { FALLBACK_IMG } = useHelpers();
const { storeSettings } = useAppConfig();

const { item } = defineProps({
  item: { type: Object, required: true },
});

const productType = computed(() => (item.variation ? item.variation?.node : item.product?.node));
const productSlug = computed(() => `/product/${decodeURIComponent(item.product.node.slug)}`);
const isLowStock = computed(() => (productType.value.stockQuantity ? productType.value.lowStockAmount >= productType.value.stockQuantity : false));
const imgScr = computed(() => productType.value.image?.cartSourceUrl || productType.value.image?.sourceUrl || item.product.image?.sourceUrl || FALLBACK_IMG);
const regularPrice = computed(() => Number.parseFloat(productType.value.rawRegularPrice));
const salePrice = computed(() => Number.parseFloat(productType.value.rawSalePrice));
const salePercentage = computed(() => Math.round(((regularPrice.value - salePrice.value) / regularPrice.value) * 100) + '%');
const isOptimisticItem = computed(() => String(item.key || '').startsWith('optimistic:'));

const removeItem = () => {
  if (isOptimisticItem.value) return;
  updateItemQuantity(item.key, 0);
};

const moveToWishList = () => {
  addToWishlist(item.product.node);
  removeItem();
};
</script>

<template>
  <SwipeCard :disabled="isOptimisticItem" @remove="removeItem">
    <div v-if="productType" class="flex items-center gap-3 group cart-card-row">
      <NuxtLink :to="productSlug">
        <NuxtPicture
          width="64"
          height="64"
          :src="imgScr"
          :alt="productType.image?.altText || productType.name"
          :title="productType.image?.title || productType.name"
          loading="lazy"
          :img-attrs="{ class: 'w-16 h-16 skeleton' }" />
      </NuxtLink>
      <div class="flex-1">
        <div class="flex gap-x-2 gap-y-1 flex-wrap items-center">
          <NuxtLink class="leading-tight line-clamp-2 cart-item-name" :to="productSlug">{{ productType.name }}</NuxtLink>
          <span v-if="productType.salePrice" class="cart-badge-sale">Save {{ salePercentage }}</span>
          <span v-if="isLowStock" class="cart-badge-lowstock">Low Stock</span>
        </div>
        <ProductPrice class="mt-1 text-xs" :sale-price="productType.salePrice" :regular-price="productType.regularPrice" />
      </div>
      <div class="inline-flex gap-2 flex-col items-end">
        <QuantityInput :item />
        <div class="text-[11px] cart-card-actions flex leading-none items-center">
          <button
            v-if="storeSettings.showMoveToWishlist"
            class="mr-2 pr-2 border-r border-[var(--color-sand)] disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="isOptimisticItem"
            type="button"
            @click="moveToWishList">
            Move to Wishlist
          </button>
          <button
            title="Remove Item"
            aria-label="Remove Item"
            type="button"
            :disabled="isOptimisticItem"
            class="remove-btn flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50"
            @click="removeItem">
            <Icon name="ion:trash" class="hidden md:inline-block" size="12" />
          </button>
        </div>
      </div>
    </div>
  </SwipeCard>
</template>

<style scoped>
.cart-card-row {
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-sand);
}

.cart-item-name {
  color: var(--color-charcoal);
  transition: opacity 0.2s ease;
}

.cart-item-name:hover {
  opacity: 0.7;
}

.cart-badge-sale {
  font-size: 10px;
  line-height: 1;
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
  color: color-mix(in oklab, var(--color-charcoal) 80%, transparent);
  background-color: var(--color-sand);
  border: 1px solid var(--color-sand);
}

.cart-badge-lowstock {
  font-size: 10px;
  line-height: 1;
  padding: 0.125rem 0.25rem;
  border-radius: 2px;
  color: #92620a;
  background-color: #fef3c7;
  border: 1px solid #fde68a;
}

.cart-card-actions {
  color: color-mix(in oklab, var(--color-charcoal) 45%, transparent);
}

.cart-card-actions:hover {
  color: var(--color-charcoal);
}

.remove-btn:hover {
  color: #9a3b26;
}
</style>
