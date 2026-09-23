<script setup lang="ts">
import { OrderStatusEnum } from '#gql/default';
import type { Order } from '#types/gql';

const { query, params, name } = useRoute();
const { formatDate, getErrorMessage } = useHelpers();
const { t } = useI18n();
const { cart, emptyCart, refreshCart } = useCart();
const gql = useWooGraphQL();

const order = ref<Order | null>(null);
const fetchDelay = ref<boolean>(query.fetch_delay === 'true');
const delayLength = 2500;
const isLoaded = ref<boolean>(false);
const errorMessage = ref('');

const isSummaryPage = computed<boolean>(() => name === 'order-summary');
const isCheckoutPage = computed<boolean>(() => name === 'order-received');
const orderIsNotCompleted = computed<boolean>(() => order.value?.status !== OrderStatusEnum.Completed);
const hasDiscount = computed<boolean>(() => !!Number.parseFloat(order.value?.rawDiscountTotal || '0'));
const downloadableItems = computed(() => order.value?.downloadableItems?.nodes || []);
const hasClearedCart = ref<boolean>(false);

const readStoredOrderFallback = (): Order | null => {
  if (!import.meta.client) return null;

  const fallbackKey = typeof query.order_fallback_key === 'string' ? query.order_fallback_key : null;
  if (!fallbackKey) return null;

  const storageKey = `woonuxt:order-fallback:${fallbackKey}`;

  try {
    const rawFallback = window.localStorage.getItem(storageKey);
    window.localStorage.removeItem(storageKey);
    if (!rawFallback) return null;

    const parsedFallback = JSON.parse(rawFallback) as Order;
    if (String(parsedFallback.databaseId ?? '') !== String(params.orderId ?? '')) return null;

    const requestOrderKey = typeof query.key === 'string' ? query.key : null;
    if (requestOrderKey && parsedFallback.orderKey && parsedFallback.orderKey !== requestOrderKey) return null;

    return parsedFallback;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
};

const clearCartIfNeeded = async () => {
  if (hasClearedCart.value || !isCheckoutPage.value || !order.value) return;
  hasClearedCart.value = true;
  await emptyCart();
  await refreshCart();
};

onBeforeMount(() => {
  const shouldCloseChildWindow = isCheckoutPage.value && !!(query.cancel_order || query.from_paypal || query.PayerID);

  if (!shouldCloseChildWindow) {
    order.value = readStoredOrderFallback();
  }

  /**
   * This is to close the child PayPal window we open on the checkout page.
   * It will fire off an event that redirects the parent window to the order summary page.
   */
  if (shouldCloseChildWindow) window.close();
});

onMounted(async () => {
  await getOrder();

  // Clear the cart once the order is confirmed to be loaded.
  await clearCartIfNeeded();

  /**
   * WooCommerce sometimes takes a while to update the order status.
   * This is a workaround to fetch the order again after a delay.
   * The length of the delay might need to be adjusted depending on your server.
   */

  if (isCheckoutPage.value && fetchDelay.value && orderIsNotCompleted.value) {
    setTimeout(() => {
      getOrder();
    }, delayLength);
  }
});

watch(
  () => cart.value,
  () => {
    void clearCartIfNeeded();
  },
  { immediate: true },
);

async function getOrder() {
  try {
    const { customer } = await gql.getOrder({ id: String(params.orderId) });
    const fetchedOrder = customer?.orders?.nodes?.[0];

    if (fetchedOrder) {
      order.value = fetchedOrder;
      errorMessage.value = '';
    } else if (!order.value) {
      errorMessage.value = 'Could not find order';
    }
  } catch (err: unknown) {
    if (!order.value) {
      errorMessage.value = getErrorMessage(err) || 'Could not find order';
    }
  }
  isLoaded.value = true;
}

const refreshOrder = async () => {
  isLoaded.value = false;
  await getOrder();
};

useSeoMeta({
  title() {
    return isSummaryPage.value ? t('shop.orderSummary') : t('shop.orderReceived');
  },
});
</script>

<template>
  <div class="order-detail-page w-full min-h-150 flex flex-col items-center p-4 md:my-16 md:mt-8 md:max-w-3xl md:mx-auto md:p-12">
    <LoadingIcon v-if="!isLoaded" class="flex-1" color="var(--color-charcoal)" />
    <template v-else>
      <div v-if="order" class="w-full">
        <template v-if="isSummaryPage">
          <div class="flex items-center gap-4">
            <NuxtLink to="/my-account?tab=orders" class="order-detail-icon-btn" title="Back to orders" aria-label="Back to orders">
              <Icon name="ion:chevron-back-outline" size="16" class="h-4 w-4" />
            </NuxtLink>
            <h1 class="heading-serif-lg">{{ $t('shop.orderSummary') }}</h1>
          </div>
        </template>
        <template v-else-if="isCheckoutPage">
          <div class="flex items-center justify-between w-full mb-2">
            <h1 class="heading-serif-lg">{{ $t('shop.orderReceived') }}</h1>
            <button
              v-if="orderIsNotCompleted"
              type="button"
              class="order-detail-icon-btn"
              title="Refresh order"
              aria-label="Refresh order"
              @click="refreshOrder">
              <Icon name="ion:refresh-outline" size="16" class="h-4 w-4" />
            </button>
          </div>
          <p class="order-detail-muted-text">{{ $t('shop.orderThanks') }}</p>
        </template>
        <hr class="order-detail-divider my-8" />
      </div>
      <div v-if="order" class="flex-1 w-full">
        <div class="flex items-start justify-between">
          <div class="w-[21%]">
            <div class="order-detail-label mb-2">{{ $t('shop.order') }}</div>
            <div class="order-detail-value leading-none">#{{ order.databaseId! }}</div>
          </div>
          <div class="w-[21%]">
            <div class="order-detail-label mb-2">{{ $t('general.date') }}</div>
            <div class="order-detail-value leading-none">{{ formatDate(order.date) }}</div>
          </div>
          <div class="w-[21%]">
            <div class="order-detail-label mb-2">{{ $t('general.status') }}</div>
            <OrderStatusLabel v-if="order.status" :order="order" />
          </div>
          <div class="w-[21%]">
            <div class="order-detail-label mb-2">{{ $t('general.paymentMethod') }}</div>
            <div class="order-detail-value leading-none">{{ order.paymentMethodTitle }}</div>
          </div>
        </div>

        <template v-if="order.lineItems">
          <hr class="order-detail-divider my-8" />

          <div class="grid gap-4">
            <div v-for="item in order.lineItems.nodes" :key="item.id" class="flex items-center justify-between gap-8">
              <NuxtLink v-if="item.product?.node" :to="`/product/${item.product.node.slug}`" class="order-detail-thumb shrink-0">
                <NuxtPicture
                  :src="item.variation?.node?.image?.sourceUrl || item.product.node?.image?.sourceUrl || '/images/placeholder.png'"
                  :alt="item.variation?.node?.image?.altText || item.product.node?.image?.altText || 'Product image'"
                  :title="item.variation?.node?.image?.title || item.product.node?.image?.title || 'Product image'"
                  width="64"
                  height="64"
                  loading="lazy"
                  :img-attrs="{ class: 'w-16 h-16 object-cover' }" />
              </NuxtLink>
              <div class="order-detail-value flex-1 leading-tight">
                {{ item.variation ? item.variation?.node?.name : item.product?.node.name! }}
              </div>
              <div class="order-detail-muted-text text-sm">Qty. {{ item.quantity }}</div>
              <span class="order-detail-value text-sm font-semibold" v-html="item.total || ''"></span>
            </div>
          </div>
        </template>

        <hr class="order-detail-divider my-8" />

        <div v-if="downloadableItems.length && !orderIsNotCompleted">
          <DownloadableItems :downloadable-items="downloadableItems" />
          <hr class="order-detail-divider my-8" />
        </div>

        <div class="order-detail-totals grid gap-1 text-sm">
          <div class="flex justify-between">
            <span>{{ $t('shop.subtotal') }}</span>
            <span class="order-detail-value tabular-nums" v-html="order.subtotal"></span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('general.tax') }}</span>
            <span class="order-detail-value tabular-nums" v-html="order.totalTax"></span>
          </div>
          <div class="flex justify-between">
            <span>{{ $t('general.shipping') }}</span>
            <span class="order-detail-value tabular-nums" v-html="order.shippingTotal"></span>
          </div>
          <div v-if="hasDiscount" class="flex justify-between order-detail-discount">
            <span>{{ $t('shop.discount') }}</span>
            <span class="tabular-nums">- <span v-html="order.discountTotal"></span></span>
          </div>
          <hr class="order-detail-divider my-8" />
          <div class="flex justify-between order-detail-total-row">
            <span class="order-detail-value">{{ $t('shop.total') }}</span>
            <span class="heading-serif-lg tabular-nums" v-html="order.total"></span>
          </div>
        </div>
      </div>
      <div v-else-if="errorMessage" class="flex flex-col items-center justify-center flex-1 w-full gap-4 text-center">
        <Icon name="ion:sad-outline" size="72" style="color: var(--color-charcoal)" />
        <h1 class="heading-serif-lg">Error</h1>
        <div v-if="errorMessage" class="order-detail-error text-sm" v-html="errorMessage"></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@reference "#tailwind";

.order-detail-page {
  font-family: var(--font-sans);
  color: var(--color-charcoal);
}

.order-detail-icon-btn {
  @apply flex h-9 w-9 items-center justify-center border bg-transparent transition-colors duration-300;
  border-color: var(--color-sand);
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
}

.order-detail-icon-btn:hover {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}

.order-detail-divider {
  border-color: var(--color-sand);
}

.order-detail-label {
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-charcoal) 50%, transparent);
}

.order-detail-value {
  color: var(--color-charcoal);
}

.order-detail-muted-text {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.order-detail-thumb {
  display: block;
  border: 1px solid var(--color-sand);
}

.order-detail-totals {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.order-detail-discount {
  color: var(--color-positive);
}

.order-detail-total-row {
  color: var(--color-charcoal);
}

.order-detail-error {
  color: var(--color-danger);
}
</style>
