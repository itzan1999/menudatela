<script setup lang="ts">
import type { PaymentGateway } from '#types/gql';

const route = useRoute();

const { t } = useI18n();
const { query } = route;
const { cart, paymentGateways, isBillingAddressEnabled, isUpdatingCart } = useCart();
const { customer, viewer, navigateToLogin } = useAuth();
const { orderInput, isProcessingOrder, processCheckout, checkoutError, resolvePaymentMethodId } = useCheckout();
const { setActiveGateway, isActiveGatewayReady, processActiveGatewayPayment, getActiveGatewayDisabledMessage, resetActiveGateway } = usePaymentGateways();

const isSubmitting = ref(false);
const buttonText = computed(() => (isSubmitting.value || isProcessingOrder.value ? t('general.processing') : t('shop.checkoutButton')));
const checkoutPaymentGateways = paymentGateways;
const selectedPaymentMethodId = computed<string>(() => resolvePaymentMethodId(orderInput.value.paymentMethod));

const isInvalidEmail = ref<boolean>(false);
const emailRegex = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;

type CheckoutViewerSummary = {
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  databaseId?: number | null;
};

const viewerSummary = computed<CheckoutViewerSummary | null>(() => viewer.value as CheckoutViewerSummary | null);
const viewerEmail = computed<string>(() => customer.value?.billing?.email || viewerSummary.value?.email || '');
const viewerFirstName = computed<string>(() => customer.value?.billing?.firstName || viewerSummary.value?.firstName || '');
const viewerLastName = computed<string>(() => customer.value?.billing?.lastName || viewerSummary.value?.lastName || '');
const viewerGreeting = computed<string>(() => {
  const name = [viewerFirstName.value, viewerLastName.value].filter(Boolean).join(' ');
  return name ? t('checkout.welcomeBack', { name }) : t('checkout.welcome');
});
const isCheckoutDisabled = computed<boolean>(() => {
  if (isSubmitting.value || isProcessingOrder.value || isUpdatingCart.value || !selectedPaymentMethodId.value) return true;
  return !isActiveGatewayReady.value;
});

// Sync the shipping-address toggle with orderInput so checkout logic stays consistent
const shipToDifferentAddress = computed<boolean>({
  get: () => !!orderInput.value.shipToDifferentAddress,
  set: (value) => {
    orderInput.value.shipToDifferentAddress = value;
  },
});

const requiresShipping = computed<boolean>(() => {
  const currentCart = cart.value as
    | (typeof cart.value & {
        needsShippingAddress?: boolean | null;
      })
    | null;

  if (!currentCart || currentCart.isEmpty) return false;

  // Prefer cart-level shipping flags from WooGraphQL/WooCommerce.
  if (typeof currentCart.needsShippingAddress === 'boolean') {
    if (currentCart.needsShippingAddress) return true;
    if ((currentCart.availableShippingMethods?.length ?? 0) > 0) return true;
    if ((currentCart.chosenShippingMethods?.length ?? 0) > 0) return true;
  }

  // Fallback for incomplete payloads: infer from item virtual flags when present.
  const cartNodes = currentCart.contents?.nodes ?? [];
  if (!cartNodes.length) return false;

  const hasExplicitVirtualFlags = cartNodes.some((item) => typeof (item?.product?.node as { virtual?: boolean } | null)?.virtual === 'boolean');
  if (hasExplicitVirtualFlags) {
    return cartNodes.some((item) => (item?.product?.node as { virtual?: boolean } | null)?.virtual !== true);
  }

  // Last resort: assume shipping is needed for non-empty carts.
  return true;
});

const hasAvailableShippingMethods = computed<boolean>(() => {
  return !!cart.value?.availableShippingMethods?.[0]?.rates?.length;
});

const copyBillingToShipping = (): void => {
  if (!customer.value?.billing) return;
  customer.value.shipping = { ...customer.value.billing };
};

watch(shipToDifferentAddress, (newValue) => {
  if (!customer.value?.billing) return;

  if (!customer.value.shipping) {
    copyBillingToShipping();
    return;
  }

  if (!newValue) {
    Object.assign(customer.value.shipping, customer.value.billing);
  }
});

onBeforeMount(() => {
  if (query.cancel_order) window.close();

  if (customer.value && !customer.value.shipping && customer.value.billing) {
    copyBillingToShipping();
  }
});

const shouldShowShippingFlow = computed<boolean>(() => {
  if (!cart.value || cart.value.isEmpty) return false;
  if (requiresShipping.value) return true;
  if (hasAvailableShippingMethods.value) return true;
  return (cart.value.chosenShippingMethods?.length ?? 0) > 0;
});

watchEffect(() => {
  if (viewer.value && customer.value?.billing && !customer.value.billing.email && viewerEmail.value) {
    customer.value.billing.email = viewerEmail.value;
  }
});

watch(
  selectedPaymentMethodId,
  (gatewayId) => {
    if (gatewayId) void setActiveGateway(gatewayId);
  },
  { immediate: true },
);

const handleGatewaySelect = (gateway: PaymentGateway): void => {
  orderInput.value.paymentMethod = gateway;
  void setActiveGateway(gateway);
};

const payNow = async () => {
  if (isCheckoutDisabled.value) return;
  // Lock before the first await, covering gateway confirmation as well as order creation.
  isSubmitting.value = true;
  checkoutError.value = null;
  try {
    await setActiveGateway(orderInput.value.paymentMethod);
    resetActiveGateway();
    orderInput.value.transactionId = '';
    if (!isActiveGatewayReady.value) {
      throw new Error(getActiveGatewayDisabledMessage() || t('error.selectPaymentMethod'));
    }
    const paymentResult = await processActiveGatewayPayment();
    if (!paymentResult.success) {
      throw new Error(paymentResult.error || t('error.paymentFailed'));
    }
    await processCheckout(paymentResult.isPaid);
  } catch (error) {
    console.error('Checkout error:', error);
    checkoutError.value = error instanceof Error ? error.message : t('error.checkoutUnexpected');
  } finally {
    isSubmitting.value = false;
  }
};

const checkEmailOnBlur = (email?: string | null): void => {
  if (email) isInvalidEmail.value = !emailRegex.test(email);
};

const checkEmailOnInput = (email?: string | null): void => {
  if (email && isInvalidEmail.value) isInvalidEmail.value = false;
};

useSeoMeta({
  title: t('shop.checkout'),
});
</script>

<template>
  <div class="flex flex-col min-h-150">
    <template v-if="cart && customer">
      <div v-if="cart.isEmpty" class="flex flex-col items-center justify-center flex-1 mb-12 text-center">
        <Icon name="ion:cart-outline" size="96" style="color: var(--color-sand)" class="mb-5" />
        <h2 class="mb-2 font-heading text-2xl" style="color: var(--color-charcoal)">{{ $t('shop.cartEmpty') }}</h2>
        <span class="mb-8 text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 60%, transparent)">{{ $t('shop.addProductsInYourCart') }}</span>
        <NuxtLink to="/products" class="browse-products-btn"> {{ $t('shop.browseOurProducts') }} </NuxtLink>
      </div>

      <form v-else class="checkout-container container flex flex-wrap items-start gap-8 my-16 justify-evenly lg:gap-16" @submit.prevent="payNow">
        <div class="checkout-form grid w-full gap-8 wn-form lg:flex-1">
          <div v-if="viewer" class="checkout-section">
            <div class="">
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="heading-serif-lg">{{ viewerGreeting }}</h1>
              </div>
              <p v-if="viewerEmail" class="flex flex-wrap items-center gap-2 text-sm mt-4 checkout-muted-text">
                <span class="opacity-70">{{ $t('billing.email') }}: </span>
                <span class="truncate" :title="viewerEmail">{{ viewerEmail }}</span>
              </p>
              <p v-if="viewerSummary?.databaseId" class="flex flex-wrap items-center gap-2 text-sm checkout-muted-text">
                <span class="opacity-70">{{ $t('checkout.customerId') }}: </span>
                <span>#{{ viewerSummary.databaseId }}</span>
              </p>
            </div>
          </div>

          <div v-if="!viewer" class="checkout-section">
            <h1 class="heading-serif-lg">{{ $t('checkout.guestCheckoutTitle') }}</h1>
            <div class="flex justify-between items-center gap-4 mt-3" @click="navigateToLogin(route.fullPath)">
              <p class="text-sm checkout-muted-text">{{ $t('checkout.guestCheckoutText') }}</p>
              <Button type="button" class="ml-auto tracking-wider uppercase text-xs font-medium" size="sm" variant="outline-charcoal"> {{ $t('account.signIn') }} </Button>
            </div>
          </div>

          <!-- Billing details -->
          <div v-if="customer?.billing" class="checkout-section">
            <div>
              <h3 class="section-title">
                {{ $t('billing.billingDetails') }}
              </h3>
            </div>

            <div v-if="!viewer" class="w-full mt-4">
              <label for="email">{{ $t('billing.email') }}</label>
              <input
                v-model="customer.billing.email"
                placeholder="johndoe@email.com"
                autocomplete="email"
                type="email"
                name="email"
                :class="{ 'has-error': isInvalidEmail }"
                required
                @blur="checkEmailOnBlur(customer.billing.email)"
                @input="checkEmailOnInput(customer.billing.email)" />
              <Transition name="scale-y" mode="out-in">
                <div v-if="isInvalidEmail" class="mt-1 text-sm text-red-500">{{ $t('error.invalidEmail') }}</div>
              </Transition>
            </div>
            <div v-if="!viewer && orderInput.createAccount" class="flex w-full mt-4 gap-4">
              <div class="flex-1">
                <label for="checkout-username">{{ $t('account.username') }}</label>
                <input
                  id="checkout-username"
                  v-model="orderInput.username"
                  placeholder="johndoe"
                  autocomplete="username"
                  type="text"
                  name="username"
                  autocapitalize="none"
                  :required="orderInput.createAccount" />
              </div>
              <div class="flex-1">
                <label for="checkout-password">{{ $t('account.password') }}</label>
                <PasswordInput
                  id="checkout-password"
                  v-model="orderInput.password"
                  name="new-password"
                  placeholder="••••••••••"
                  autocomplete="new-password"
                  :required="orderInput.createAccount" />
              </div>
            </div>
            <div v-if="!viewer" class="flex items-center gap-2 mt-4">
              <input id="creat-account" v-model="orderInput.createAccount" type="checkbox" name="creat-account" class="form-checkbox" />
              <label for="creat-account">{{ $t('account.createAccountQuestion') }}</label>
            </div>
            <hr v-if="!viewer" class="flex-1 my-6 border-[var(--color-sand)]" />

            <div :class="viewer ? 'mt-4' : 'mt-6'">
              <AddressForm v-if="customer?.billing" v-model="customer.billing" address-type="billing" :show-address-fields="isBillingAddressEnabled" />
            </div>

            <div v-if="shouldShowShippingFlow" class="flex items-center gap-3 mt-6">
              <input
                id="ship-to-different-address"
                v-model="shipToDifferentAddress"
                type="checkbox"
                name="ship-to-different-address"
                class="form-checkbox" />
              <label for="ship-to-different-address" class="text-sm font-medium" style="color: var(--color-charcoal)">
                {{ $t('billing.differentAddress') }}
              </label>
            </div>
          </div>

          <div v-if="shipToDifferentAddress" class="checkout-section">
            <div class="mb-6">
              <h3 class="section-title flex items-center gap-2">
                <span>{{ $t('general.shippingAddress') }}</span>
              </h3>
            </div>
            <AddressForm v-if="customer?.shipping" v-model="customer.shipping" address-type="shipping" />
          </div>
          <!-- Shipping methods -->
          <div v-if="shouldShowShippingFlow && hasAvailableShippingMethods && cart?.chosenShippingMethods?.[0]" class="checkout-section">
            <h3 class="section-title flex items-center gap-2">
              <span>{{ $t('general.shippingSelect') }}</span>
            </h3>
            <ShippingOptions :options="cart?.availableShippingMethods?.[0]?.rates ?? []" :active-option="cart.chosenShippingMethods[0]" />
          </div>

          <!-- Pay methods -->
          <div v-if="checkoutPaymentGateways?.nodes.length" class="checkout-section col-span-full">
            <h3 class="section-title flex items-center gap-2">
              <span>{{ $t('billing.paymentOptions') }}</span>
            </h3>

            <PaymentOptions
              :model-value="orderInput.paymentMethod"
              class="mb-4"
              :payment-gateways="checkoutPaymentGateways"
              @update:model-value="handleGatewaySelect" />

            <PaymentGatewayComponent :gateway="orderInput.paymentMethod" />
          </div>

          <!-- Order note -->
          <div class="checkout-section">
            <h3 class="section-title">{{ $t('shop.orderNote') }} ({{ $t('general.optional') }})</h3>
            <textarea
              id="order-note"
              v-model="orderInput.customerNote"
              name="order-note"
              class="w-full min-h-25"
              rows="4"
              :placeholder="$t('shop.orderNotePlaceholder')"></textarea>
          </div>

          <!-- Hook: After checkout review/order note -->
          <HookOutlet name="checkout.review.after" :ctx="{ checkout: orderInput }" as="div" />
        </div>

        <OrderSummary>
          <p v-if="checkoutError" role="alert" class="text-red-500 text-sm mt-2">{{ checkoutError }}</p>
          <Button
            :loading="isSubmitting || isProcessingOrder"
            :disabled="isCheckoutDisabled"
            size="lg"
            type="submit"
            class="mt-4 w-full tracking-wider uppercase text-xs font-medium"
            variant="outline-charcoal">
            {{ buttonText }}
          </Button>
        </OrderSummary>
      </form>
    </template>
    <LoadingIcon v-else class="m-auto" color="var(--color-charcoal)" />
  </div>
</template>

<style>
@reference "#tailwind";

.checkout-container,
.checkout-form {
  container-type: inline-size;
}

.checkout-section {
  @apply w-full border p-4 sm:p-8;
  background-color: var(--color-cream);
  border-color: var(--color-sand);
}

.checkout-muted-text {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.browse-products-btn {
  padding: 0.75rem 1.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  background-color: transparent;
  border: 1px solid var(--color-sand);
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease;
}

.browse-products-btn:hover {
  background-color: var(--color-charcoal);
  border-color: var(--color-charcoal);
  color: var(--color-cream);
}

/* Email validation */
.scale-y-enter-active,
.scale-y-leave-active {
  transition: all 0.2s ease-in-out;
}

.scale-y-enter-from,
.scale-y-leave-to {
  opacity: 0;
  transform: scaleY(0);
  transform-origin: top;
}
</style>
