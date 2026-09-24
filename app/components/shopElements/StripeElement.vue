<script setup lang="ts">
import type { Appearance, Stripe, StripeElements, StripeElementsOptionsClientSecret, StripePaymentElement } from '@stripe/stripe-js';

const props = defineProps<{
  stripe: Stripe;
  clientSecret?: string | null;
  customerId?: string | null;
  amount?: number | null;
  currency?: string | null;
  saveForFuture?: boolean;
}>();
const emit = defineEmits(['updateElement']);
const { siteName } = useAppConfig();
let elements: StripeElements | null = null;
let paymentElement: StripePaymentElement | null = null;
let elementsMode: 'intent' | 'deferred' | null = null;

const isReloading = ref(false);
const containerEl = ref<HTMLElement | null>(null);
let reservedHeight = 0;

const normalizedCurrency = computed(() => (props.currency || '').toLowerCase());
const normalizedAmount = computed(() => (typeof props.amount === 'number' ? Math.max(0, props.amount) : null));
const normalizedSetupFutureUsage = computed<'off_session' | null>(() => (props.saveForFuture ? 'off_session' : null));

/** Deferred mode has no customer association. If a customerId is set, wait for
 * a clientSecret (intent mode) instead. */
const canCreateDeferred = computed(() => !props.clientSecret && !props.customerId && !!normalizedCurrency.value && (normalizedAmount.value ?? 0) > 0);

const resolveComputedStyle = (el: Element, prop: string, fallback: string): string => {
  if (!import.meta.client) return fallback;
  return getComputedStyle(el).getPropertyValue(prop).trim() || fallback;
};

const stripeAppearance = computed<Appearance>(() => {
  const charcoalColor = resolveComputedStyle(document.documentElement, '--color-charcoal', '#221e1a');
  const sandColor = resolveComputedStyle(document.documentElement, '--color-sand', '#dcd3c4');
  const creamColor = resolveComputedStyle(document.documentElement, '--color-cream', '#f7f2ea');
  const dangerColor = resolveComputedStyle(document.documentElement, '--color-danger', '#b3382c');

  return {
    theme: 'flat',
    labels: 'above' as const,
    inputs: 'spaced' as const,
    variables: {
      colorPrimary: charcoalColor,
      colorText: charcoalColor,
      colorDanger: dangerColor,
      fontFamily: resolveComputedStyle(document.body, 'font-family', 'inherit'),
      fontSizeBase: '16px',
      borderRadius: '0px',
    },
    rules: {
      '.Input': {
        backgroundColor: creamColor,
        border: `1px solid ${sandColor}`,
        padding: '10px 12px',
        boxShadow: 'none',
      },
      '.Input:focus': {
        borderColor: charcoalColor,
        boxShadow: `0 0 0 1px ${charcoalColor}`,
      },
      '.Input--invalid': {
        borderColor: 'var(--colorDanger)',
        boxShadow: '0 0 0 1px var(--colorDanger)',
      },
      '.Label': {
        color: charcoalColor,
      },
      '.Tab': {
        backgroundColor: creamColor,
        border: `1px solid ${sandColor}`,
        borderRadius: '0px',
      },
      '.Tab:hover': {
        borderColor: charcoalColor,
      },
      '.Tab--selected': {
        borderColor: charcoalColor,
        backgroundColor: charcoalColor,
      },
      '.TabIcon': {
        fill: charcoalColor,
      },
      '.TabLabel': {
        color: charcoalColor,
      },
      '.TabIcon--selected': {
        fill: creamColor,
      },
      '.TabLabel--selected': {
        color: creamColor,
      },
    },
  };
});

const resetStripeElements = () => {
  if (paymentElement && containerEl.value) {
    reservedHeight = containerEl.value.offsetHeight || reservedHeight;
  }
  if (paymentElement) {
    paymentElement.unmount();
  }
  paymentElement = null;
  elements = null;
  elementsMode = null;
  emit('updateElement', null);
};

const createStripeElements = async () => {
  isReloading.value = !!paymentElement;
  resetStripeElements();

  if (props.clientSecret) {
    const elementsOptions: StripeElementsOptionsClientSecret = {
      clientSecret: props.clientSecret,
      appearance: stripeAppearance.value,
    };
    elements = props.stripe.elements(elementsOptions);
    elementsMode = 'intent';
  } else {
    if (!canCreateDeferred.value) {
      isReloading.value = false;
      return;
    }
    elements = props.stripe.elements({
      mode: 'payment',
      currency: normalizedCurrency.value,
      amount: normalizedAmount.value ?? 0,
      setupFutureUsage: normalizedSetupFutureUsage.value,
      appearance: stripeAppearance.value,
    });
    elementsMode = 'deferred';
  }

  paymentElement = elements.create('payment', {
    layout: 'tabs',
    business: { name: siteName },
    paymentMethodOrder: ['card', 'apple_pay', 'google_pay', 'paypal'],
    fields: {
      billingDetails: {
        name: 'auto',
        email: 'auto',
        phone: 'auto',
        address: 'auto',
      },
    },
    wallets: {
      applePay: 'auto',
      googlePay: 'auto',
    },
  });
  paymentElement.mount('#payment-element');
  paymentElement.on('ready', () => {
    isReloading.value = false;
  });

  if (elements) emit('updateElement', elements);
};

// Single combined watcher: clientSecret and canCreateDeferred both decide whether
// elements should exist, so reacting to them separately let a change to both in the
// same tick trigger createStripeElements() twice (double network call + iframe remount).
watch([() => props.clientSecret, canCreateDeferred], ([clientSecret, canCreate]) => {
  if (!clientSecret && !canCreate) {
    resetStripeElements();
    return;
  }
  createStripeElements();
});

watch([normalizedAmount, normalizedCurrency, normalizedSetupFutureUsage], async ([amount, currency, setupFutureUsage]) => {
  if (!elements || elementsMode !== 'deferred') return;
  if (!amount || !currency) return;

  try {
    await elements.update({
      mode: 'payment',
      amount,
      currency,
      setupFutureUsage,
      appearance: stripeAppearance.value,
    });
  } catch (error) {
    console.error('Failed to update Stripe elements:', error);
  }
});

onMounted(() => {
  createStripeElements();
});

onUnmounted(() => {
  resetStripeElements();
});
</script>

<template>
  <div ref="containerEl" class="stripe-elements-container" :style="isReloading && reservedHeight ? { minHeight: `${reservedHeight}px` } : undefined">
    <div id="payment-element" class="stripe-element"></div>
    <div v-if="isReloading" class="stripe-reloading-overlay">
      <span class="stripe-reloading-spinner"></span>
    </div>
  </div>
</template>

<style scoped>
@reference "#tailwind";

.stripe-elements-container {
  @apply relative w-full;
}

.stripe-element {
  @apply w-full;
}

.stripe-reloading-overlay {
  @apply absolute inset-0 flex items-center justify-center;
  background-color: color-mix(in oklab, var(--color-cream) 70%, transparent);
}

.stripe-reloading-spinner {
  @apply h-5 w-5 animate-spin rounded-full border-2;
  border-color: var(--color-sand);
  border-top-color: var(--color-charcoal);
}
</style>
