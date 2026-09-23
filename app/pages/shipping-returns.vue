<script setup lang="ts">
const { t } = useI18n();
const { viewer, getOrders, orders } = useAuth();
const { cart } = useCart();
const gql = useWooGraphQL();

const showLoader = computed(() => !cart.value && !viewer.value);

watch(
  viewer,
  (newViewer) => {
    if (newViewer && orders.value === null) getOrders();
  },
  { immediate: true },
);

const eligibleOrders = computed(() => (orders.value ?? []).filter((o) => o.returnEligible));
const trackedOrders = computed(() => (orders.value ?? []).filter((o) => o.returnStatus));
const eligibleOrdersWithForms = computed(() => eligibleOrders.value.map((order) => ({ order, form: getForm(order.databaseId!) })));

const REASONS = computed(() => [
  { value: 'wrong_item', label: t('shippingReturns.reasons.wrongItem') },
  { value: 'defective', label: t('shippingReturns.reasons.defective') },
  { value: 'not_as_described', label: t('shippingReturns.reasons.notAsDescribed') },
  { value: 'changed_mind', label: t('shippingReturns.reasons.changedMind') },
  { value: 'other', label: t('shippingReturns.reasons.other') },
]);

type FormState = {
  open: boolean;
  selected: Record<number, number>; // lineItem databaseId -> quantity
  reason: string;
  details: string;
  submitting: boolean;
  error: string;
  success: boolean;
};

const forms = reactive<Record<number, FormState>>({});

const getForm = (orderId: number): FormState => {
  if (!forms[orderId]) {
    forms[orderId] = { open: false, selected: {}, reason: '', details: '', submitting: false, error: '', success: false };
  }
  return forms[orderId];
};

const toggleItem = (orderId: number, lineItemId: number, quantity: number, checked: boolean) => {
  const form = getForm(orderId);
  if (checked) {
    form.selected[lineItemId] = quantity;
  } else {
    delete form.selected[lineItemId];
  }
};

const submitReturn = async (orderId: number) => {
  const form = getForm(orderId);
  form.error = '';

  const items = Object.entries(form.selected).map(([lineItemId, quantity]) => ({
    lineItemId: Number(lineItemId),
    quantity,
  }));

  if (!items.length) {
    form.error = t('shippingReturns.errorSelectItem');
    return;
  }
  if (!form.reason) {
    form.error = t('shippingReturns.errorSelectReason');
    return;
  }

  form.submitting = true;
  try {
    const { requestOrderReturn } = await gql.requestOrderReturn({
      orderId,
      reason: form.reason,
      details: form.details || undefined,
      items,
    });
    if (requestOrderReturn?.success) {
      form.success = true;
      form.open = false;
      await getOrders();
    } else {
      form.error = requestOrderReturn?.message || t('shippingReturns.errorGeneric');
    }
  } catch (error: any) {
    form.error = error?.gqlErrors?.[0]?.message || t('shippingReturns.errorGenericRetry');
  }
  form.submitting = false;
};

const statusLabel = (status: string | null | undefined) => {
  switch (status) {
    case 'pending':
      return t('shippingReturns.statuses.pending');
    case 'approved':
      return t('shippingReturns.statuses.approved');
    case 'rejected':
      return t('shippingReturns.statuses.rejected');
    default:
      return status || '';
  }
};

useSeoMeta({
  title: () => t('general.shippingReturns'),
});
</script>

<template>
  <main class="container my-16 max-w-4xl">
    <div v-if="showLoader" class="flex justify-center py-16">
      <LoadingIcon />
    </div>
    <template v-else>
      <h1 class="font-heading text-2xl md:text-3xl mb-6" style="color: var(--color-charcoal)">{{ $t('general.shippingReturns') }}</h1>

      <!-- Static policy -->
      <div class="policy-prose">
        <h2>{{ $t('shippingReturns.shippingTitle') }}</h2>
        <p>{{ $t('shippingReturns.shippingText') }}</p>

        <h2>{{ $t('shippingReturns.returnsTitle') }}</h2>
        <i18n-t keypath="shippingReturns.returnsText" tag="p">
          <template #days><strong>{{ $t('shippingReturns.returnsDays') }}</strong></template>
        </i18n-t>
      </div>

      <!-- Not logged in -->
      <div v-if="!viewer" class="login-prompt mt-12">
        <p>{{ $t('shippingReturns.loginPrompt') }}</p>
        <NuxtLink to="/my-account" class="login-prompt-link">{{ $t('account.signIn') }}</NuxtLink>
      </div>

      <!-- Logged in: manage returns -->
      <div v-else class="mt-12">
        <h2 class="font-heading text-xl mb-4" style="color: var(--color-charcoal)">{{ $t('shippingReturns.manageTitle') }}</h2>

        <div v-if="!orders" class="flex justify-center py-8">
          <LoadingIcon />
        </div>

        <template v-else>
          <!-- Eligible orders -->
          <div v-if="eligibleOrders.length" class="space-y-4">
            <div v-for="{ order, form } in eligibleOrdersWithForms" :key="order.databaseId" class="return-order-card">
              <div class="return-order-header" @click="form.open = !form.open">
                <div>
                  <span class="font-medium" style="color: var(--color-charcoal)">{{ $t('shop.order', 1) }} #{{ order.orderNumber }}</span>
                  <span class="text-sm ml-2" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">{{ order.date }}</span>
                </div>
                <Icon :name="form.open ? 'ion:chevron-up-outline' : 'ion:chevron-down-outline'" size="18" />
              </div>

              <div v-if="form.success" class="return-success">{{ $t('shippingReturns.successMessage') }}</div>

              <div v-if="form.open" class="return-order-body wn-form">
                <p class="text-sm mb-3" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">{{ $t('shippingReturns.selectItemsPrompt') }}</p>
                <div class="space-y-3 mb-6">
                  <label v-for="item in order.lineItems?.nodes" :key="item.id" class="return-item-row">
                    <input
                      type="checkbox"
                      @change="toggleItem(order.databaseId!, item.databaseId!, item.quantity || 1, ($event.target as HTMLInputElement).checked)" />
                    <span class="flex-1">{{ item.product?.node?.name || item.variation?.node?.name }}</span>
                    <span class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">x{{ item.quantity }}</span>
                  </label>
                </div>

                <div class="grid gap-4 md:grid-cols-2 mb-4">
                  <div class="space-y-2">
                    <label>{{ $t('shippingReturns.reasonLabel') }}</label>
                    <select v-model="form.reason">
                      <option value="" disabled>{{ $t('shippingReturns.reasonPlaceholder') }}</option>
                      <option v-for="r in REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label>{{ $t('shippingReturns.detailsLabel') }}</label>
                    <input v-model="form.details" type="text" :placeholder="$t('shippingReturns.detailsPlaceholder')" />
                  </div>
                </div>

                <p v-if="form.error" class="return-error">{{ form.error }}</p>

                <button type="button" class="save-btn" :disabled="form.submitting" @click="submitReturn(order.databaseId!)">
                  {{ form.submitting ? $t('shippingReturns.submitting') : $t('shippingReturns.submitReturn') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Tracked returns -->
          <div v-if="trackedOrders.length" class="mt-10">
            <h3 class="font-heading text-base mb-3" style="color: var(--color-charcoal)">{{ $t('shippingReturns.ongoingTitle') }}</h3>
            <div class="space-y-2">
              <div v-for="order in trackedOrders" :key="order.databaseId" class="tracked-row">
                <span>{{ $t('shop.order', 1) }} #{{ order.orderNumber }}</span>
                <span class="tracked-status" :class="`tracked-status--${order.returnStatus}`">{{ statusLabel(order.returnStatus) }}</span>
              </div>
            </div>
          </div>

          <p v-if="!eligibleOrders.length && !trackedOrders.length" class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">
            {{ $t('shippingReturns.noEligibleOrders') }}
          </p>
        </template>
      </div>
    </template>
  </main>
</template>

<style scoped>
.policy-prose h2 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-charcoal);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.policy-prose h2:first-child {
  margin-top: 0;
}

.policy-prose p {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
}

.login-prompt {
  padding: 1.5rem;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  text-align: center;
}

.login-prompt p {
  font-size: 0.9375rem;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
  margin-bottom: 1rem;
}

.login-prompt-link {
  display: inline-block;
  padding: 0.625rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  border: 1px solid var(--color-charcoal);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.login-prompt-link:hover {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.return-order-card {
  border: 1px solid var(--color-sand);
  background-color: var(--color-cream);
}

.return-order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  cursor: pointer;
}

.return-order-body {
  padding: 0 1.25rem 1.25rem;
  border-top: 1px solid var(--color-sand);
  padding-top: 1.25rem;
}

.return-item-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-charcoal);
  cursor: pointer;
}

.return-error {
  font-size: 0.8125rem;
  color: var(--color-danger);
  margin-bottom: 0.75rem;
}

.return-success {
  margin: 0 1.25rem 1rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  background-color: #eaf4ea;
  border: 1px solid #cfe6cf;
  color: #2e7d32;
}

.save-btn {
  padding: 0.625rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  background-color: transparent;
  border: 1px solid var(--color-charcoal);
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tracked-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--color-charcoal);
  border: 1px solid var(--color-sand);
}

.tracked-status {
  display: inline-block;
  border: 1px solid var(--color-sand);
  padding: 0.25rem 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
  background-color: transparent;
}

.tracked-status--pending {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}

.tracked-status--approved {
  border-color: var(--color-charcoal);
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.tracked-status--rejected {
  border-color: var(--color-danger);
  color: var(--color-danger);
}
</style>
