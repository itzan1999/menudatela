<script setup lang="ts">
const { t } = useI18n();
const { viewer, getOrders, orders } = useAuth();
const { cart, refreshCart } = useCart();
const { formatDate, formatPrice } = useHelpers();
const gql = useWooGraphQL();

// The global init plugin only does a full cart/viewer fetch up front for a small page allowlist
// (checkout/my-account/order-summary), to avoid that cost on every route — this page needs to
// know the visitor's auth state too, so it can't just wait on `cart`/`viewer` state the plugin
// was never going to populate here. Trigger the same fetch directly instead, and track whether
// it's actually finished rather than inferring that from `cart`/`viewer` still being null, which
// is exactly as true for "haven't checked yet" as for "checked — this is a guest".
const authChecked = ref(!!cart.value || !!viewer.value);
onMounted(async () => {
  if (!authChecked.value) {
    await refreshCart();
    authChecked.value = true;
  }
});

const showLoader = computed(() => !authChecked.value);

watch(
  viewer,
  (newViewer) => {
    if (newViewer && orders.value === null) getOrders();
  },
  { immediate: true },
);

type OrderLineItem = {
  databaseId?: number | null;
  quantity?: number | null;
  rawTotal?: string | null;
  rawTotalTax?: string | null;
  product?: { node?: { name?: string | null } | null } | null;
  variation?: { node?: { name?: string | null } | null } | null;
};

// Per-unit price including tax, so a partial return of a multi-unit line item is estimated
// proportionally to the quantity actually selected rather than the full line's total.
const lineItemUnitAmount = (item: OrderLineItem): number => {
  const total = Number.parseFloat(item.rawTotal || '0') || 0;
  const tax = Number.parseFloat(item.rawTotalTax || '0') || 0;
  const quantity = item.quantity || 1;
  return (total + tax) / quantity;
};

type OrderWithReturns = {
  returnItems?: ({ lineItemId?: number | null; quantity?: number | null } | null)[] | null;
  lineItems?: { nodes?: OrderLineItem[] | null } | null;
};

// Quantities from earlier return requests for this same order, so a partial return doesn't
// block requesting the remaining, not-yet-returned units of the same item later.
const alreadyRequestedQty = (order: OrderWithReturns, lineItemId: number): number =>
  order.returnItems?.find((ri) => ri?.lineItemId === lineItemId)?.quantity ?? 0;

const maxSelectableQty = (order: OrderWithReturns, item: OrderLineItem): number =>
  Math.max(0, (item.quantity ?? 0) - alreadyRequestedQty(order, item.databaseId ?? -1));

// NOTE: the backend flips returnEligible to false as soon as any return has been requested for
// the order, even a partial one, and the requestOrderReturn mutation itself rejects with "This
// order is not eligible for a return" if we try to submit again — so this can't be worked around
// from the frontend alone. Fixing it requires the WordPress resolver to allow further requests
// while the order still has line items that haven't been fully covered by a previous request.
const eligibleOrders = computed(() => (orders.value ?? []).filter((o) => o.returnEligible));
const trackedOrders = computed(() => (orders.value ?? []).filter((o) => o.returnStatus || o.refunds?.nodes?.length));
const eligibleOrdersWithForms = computed(() => eligibleOrders.value.map((order) => ({ order, form: getForm(order.databaseId!) })));

const TRACKED_ORDERS_PER_PAGE = 20;
const trackedOrdersPage = ref(1);
const trackedOrdersTotalPages = computed(() => Math.max(1, Math.ceil(trackedOrders.value.length / TRACKED_ORDERS_PER_PAGE)));
const trackedOrdersPaged = computed(() => {
  const start = (trackedOrdersPage.value - 1) * TRACKED_ORDERS_PER_PAGE;
  return trackedOrders.value.slice(start, start + TRACKED_ORDERS_PER_PAGE);
});
// The full list can only shrink after the initial load (nothing here adds new return requests to
// it), but never grow — so clamping down is the only direction that can ever be needed, e.g. if a
// customer was sitting on a later page and their order history came back shorter on a refresh.
watch(trackedOrdersTotalPages, (total) => {
  if (trackedOrdersPage.value > total) trackedOrdersPage.value = total;
});

const refundInfo = (order: { refunds?: { nodes?: { amount?: number | null; date?: string | null }[] | null } | null }) => {
  const refund = order.refunds?.nodes?.[0];
  if (!refund) return null;
  return {
    amount: formatPrice(Math.abs(Number.parseFloat(String(refund.amount ?? 0)))),
    date: formatDate(refund.date),
  };
};

// Which past return requests are expanded to show their own detail (which items, how many, why)
// instead of just the order number — keyed by order id, same lazy "only the ones you opened"
// approach as `forms` above, just without needing a whole FormState for a read-only panel.
const trackedExpanded = reactive<Record<number, boolean>>({});
const toggleTrackedExpanded = (orderId: number): void => {
  trackedExpanded[orderId] = !trackedExpanded[orderId];
};

// returnItems only carries {lineItemId, quantity} — resolve each back to the order's own
// lineItems to show what was actually returned, the same join alreadyRequestedQty() already does.
const returnedLineItems = (order: OrderWithReturns): { name: string; quantity: number }[] => {
  const lineItemsById = new Map((order.lineItems?.nodes ?? []).filter((item) => item.databaseId != null).map((item) => [item.databaseId, item]));
  return (order.returnItems ?? [])
    .map((returnItem) => {
      if (returnItem?.lineItemId == null) return null;
      const lineItem = lineItemsById.get(returnItem.lineItemId);
      if (!lineItem) return null;
      return { name: lineItem.variation?.node?.name || lineItem.product?.node?.name || '', quantity: returnItem.quantity ?? 0 };
    })
    .filter((item): item is { name: string; quantity: number } => !!item);
};

const reasonLabelFor = (value?: string | null): string => REASONS.value.find((r) => r.value === value)?.label ?? value ?? '';

const selectedLineItems = (order: { lineItems?: { nodes?: OrderLineItem[] | null } | null }, form: FormState) =>
  (order.lineItems?.nodes ?? []).filter((item) => item.databaseId != null && form.selected[item.databaseId] !== undefined);

const selectedAmountRaw = (order: { lineItems?: { nodes?: OrderLineItem[] | null } | null }, form: FormState): number =>
  selectedLineItems(order, form).reduce((sum, item) => {
    const selectedQty = item.databaseId != null ? (form.selected[item.databaseId] ?? 0) : 0;
    return sum + lineItemUnitAmount(item) * selectedQty;
  }, 0);

const returnSummary = (order: { lineItems?: { nodes?: OrderLineItem[] | null } | null }, form: FormState) => {
  const items = selectedLineItems(order, form).map((item) => ({
    name: item.variation?.node?.name || item.product?.node?.name || '',
    quantity: item.databaseId != null ? form.selected[item.databaseId] : 0,
  }));
  const reasonLabel = REASONS.value.find((r) => r.value === form.reason)?.label ?? '';
  return { items, reasonLabel, amount: formatPrice(selectedAmountRaw(order, form)) };
};

const buildReturnDetails = (order: { lineItems?: { nodes?: OrderLineItem[] | null } | null }, form: FormState): string => {
  const summary = returnSummary(order, form);
  const itemsList = summary.items.map((item) => `- ${item.name} x${item.quantity}`).join('\n');
  const sections = [
    `${t('shippingReturns.summaryItemsLabel')}:\n${itemsList}`,
    `${t('shippingReturns.reasonLabel')}: ${summary.reasonLabel}`,
    `${t('shippingReturns.summaryAmountLabel')}: ${summary.amount}`,
  ];
  if (form.details.trim()) {
    sections.push(`${t('shippingReturns.summaryCommentLabel')}: ${form.details.trim()}`);
  }
  // A plain blank line (\n\n) isn't enough here: WordPress's note display collapses runs of
  // newlines down to a single line break, so consecutive sections would end up glued together
  // with no visible gap. A literal separator line survives that collapsing.
  // The leading \n pushes our first section onto its own line, since WordPress prepends
  // "Details: " directly before this string with no separator of its own.
  return '\n' + sections.join('\n———\n');
};

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

const setItemQuantity = (orderId: number, lineItemId: number, quantity: number, max: number) => {
  const form = getForm(orderId);
  const clamped = Math.max(0, Math.min(quantity, max));
  if (clamped > 0) {
    form.selected[lineItemId] = clamped;
  } else {
    const { [lineItemId]: _removed, ...rest } = form.selected;
    form.selected = rest;
  }
};

const submitReturn = async (orderId: number) => {
  const form = getForm(orderId);
  form.error = '';

  const order = eligibleOrders.value.find((o) => o.databaseId === orderId);

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
      details: order ? buildReturnDetails(order, form) : form.details || undefined,
      items,
    });
    if (requestOrderReturn?.success) {
      form.success = true;
      form.open = false;
      await getOrders();
    } else {
      form.error = requestOrderReturn?.message || t('shippingReturns.errorGeneric');
    }
  } catch (error) {
    form.error = (error as { gqlErrors?: { message?: string }[] })?.gqlErrors?.[0]?.message || t('shippingReturns.errorGenericRetry');
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
          <template #days
            ><strong>{{ $t('shippingReturns.returnsDays') }}</strong></template
          >
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
                  <span class="text-sm ml-2" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">{{ formatDate(order.date) }}</span>
                </div>
                <Icon :name="form.open ? 'ion:chevron-up-outline' : 'ion:chevron-down-outline'" size="18" />
              </div>

              <div v-if="form.success" class="return-success">{{ $t('shippingReturns.successMessage') }}</div>

              <div v-if="form.open" class="return-order-body wn-form">
                <p class="text-sm mb-3" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
                  {{ $t('shippingReturns.selectItemsPrompt') }}
                </p>
                <div class="space-y-3 mb-6">
                  <div v-for="item in order.lineItems?.nodes" :key="item.id" class="return-item-row">
                    <span class="flex-1">{{ item.product?.node?.name || item.variation?.node?.name }}</span>
                    <span
                      v-if="maxSelectableQty(order, item) <= 0"
                      class="text-xs"
                      style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">
                      {{ $t('shippingReturns.alreadyRequested') }}
                    </span>
                    <template v-else>
                      <div class="qty-input">
                        <button
                          type="button"
                          class="qty-btn"
                          :title="$t('shop.decreaseQuantity')"
                          :aria-label="$t('shop.decreaseQuantity')"
                          :disabled="(form.selected[item.databaseId!] ?? 0) <= 0"
                          @click="setItemQuantity(order.databaseId!, item.databaseId!, (form.selected[item.databaseId!] ?? 0) - 1, maxSelectableQty(order, item))">
                          <Icon name="ion:remove" size="13" />
                        </button>
                        <input
                          type="number"
                          class="qty-field"
                          min="0"
                          :max="maxSelectableQty(order, item)"
                          :aria-label="$t('shop.quantity')"
                          :value="form.selected[item.databaseId!] ?? 0"
                          @change="setItemQuantity(order.databaseId!, item.databaseId!, Number(($event.target as HTMLInputElement).value), maxSelectableQty(order, item))" />
                        <button
                          type="button"
                          class="qty-btn"
                          :title="$t('shop.increaseQuantity')"
                          :aria-label="$t('shop.increaseQuantity')"
                          :disabled="(form.selected[item.databaseId!] ?? 0) >= maxSelectableQty(order, item)"
                          @click="setItemQuantity(order.databaseId!, item.databaseId!, (form.selected[item.databaseId!] ?? 0) + 1, maxSelectableQty(order, item))">
                          <Icon name="ion:add" size="13" />
                        </button>
                      </div>
                      <span class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)"
                        >/ {{ maxSelectableQty(order, item) }}</span
                      >
                    </template>
                  </div>
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

                <div class="return-summary mb-4">
                  <div class="return-summary-title">{{ $t('shippingReturns.summaryTitle') }}</div>
                  <template v-if="returnSummary(order, form).items.length && form.reason">
                    <p class="return-summary-line"><strong>{{ $t('shippingReturns.summaryItemsLabel') }}:</strong></p>
                    <ul class="return-summary-items">
                      <li v-for="item in returnSummary(order, form).items" :key="item.name">{{ item.name }} x{{ item.quantity }}</li>
                    </ul>
                    <p class="return-summary-line return-summary-section"><strong>{{ $t('shippingReturns.reasonLabel') }}:</strong> {{ returnSummary(order, form).reasonLabel }}</p>
                    <p class="return-summary-line return-summary-section">
                      <strong>{{ $t('shippingReturns.summaryAmountLabel') }}:</strong> {{ returnSummary(order, form).amount }}
                    </p>
                  </template>
                  <p v-else class="return-summary-line return-summary-empty">{{ $t('shippingReturns.summaryEmpty') }}</p>
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
              <div v-for="order in trackedOrdersPaged" :key="order.databaseId" class="return-order-card">
                <div class="return-order-header" @click="toggleTrackedExpanded(order.databaseId!)">
                  <div>
                    <div>
                      <span class="font-medium" style="color: var(--color-charcoal)">{{ $t('shop.order', 1) }} #{{ order.orderNumber }}</span>
                      <span v-if="!refundInfo(order)" class="tracked-status ml-2" :class="`tracked-status--${order.returnStatus}`">{{
                        statusLabel(order.returnStatus)
                      }}</span>
                    </div>
                    <!-- A full sentence (amount + date) reads as a shouted block in the all-caps badge
                         that fits a single status word — plain quiet text on its own line instead. -->
                    <p v-if="refundInfo(order)" class="refund-note">
                      <Icon name="ion:checkmark-circle-outline" size="14" class="refund-note-icon" />
                      {{ $t('shippingReturns.refundedOn', { amount: refundInfo(order)!.amount, date: refundInfo(order)!.date }) }}
                    </p>
                  </div>
                  <Icon :name="trackedExpanded[order.databaseId!] ? 'ion:chevron-up-outline' : 'ion:chevron-down-outline'" size="18" />
                </div>

                <div v-if="trackedExpanded[order.databaseId!]" class="return-order-body">
                  <p v-if="order.returnRequestedAt" class="text-sm mb-3" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
                    {{ $t('shippingReturns.requestedOn', { date: formatDate(order.returnRequestedAt) }) }}
                  </p>

                  <div class="return-summary mb-3">
                    <div class="return-summary-title">{{ $t('shippingReturns.summaryItemsLabel') }}</div>
                    <ul class="return-summary-items">
                      <li v-for="item in returnedLineItems(order)" :key="item.name">{{ item.name }} x{{ item.quantity }}</li>
                    </ul>
                  </div>

                  <p v-if="order.returnReason" class="return-summary-line">
                    <strong>{{ $t('shippingReturns.reasonLabel') }}:</strong> {{ reasonLabelFor(order.returnReason) }}
                  </p>
                </div>
              </div>
            </div>

            <nav
              v-if="trackedOrdersTotalPages > 1"
              class="tracked-pagination"
              :aria-label="$t('general.pagination')">
              <button
                type="button"
                class="prev"
                :disabled="trackedOrdersPage === 1"
                :aria-label="$t('general.previous')"
                @click="trackedOrdersPage -= 1">
                <Icon name="ion:chevron-back-outline" size="16" class="w-4 h-4" />
              </button>

              <button
                v-for="pageNumber in trackedOrdersTotalPages"
                :key="pageNumber"
                type="button"
                class="page-number"
                :aria-current="pageNumber === trackedOrdersPage ? 'page' : undefined"
                @click="trackedOrdersPage = pageNumber">
                {{ pageNumber }}
              </button>

              <button
                type="button"
                class="next"
                :disabled="trackedOrdersPage === trackedOrdersTotalPages"
                :aria-label="$t('general.next')"
                @click="trackedOrdersPage += 1">
                <Icon name="ion:chevron-forward-outline" size="16" class="w-4 h-4" />
              </button>
            </nav>
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
}

.qty-input {
  display: flex;
  align-items: stretch;
  flex-shrink: 0;
  font-size: 0.75rem;
  line-height: 1;
  border: 1px solid var(--color-sand);
}

.qty-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.75rem;
  height: 1.75rem;
  color: var(--color-charcoal);
  background-color: transparent;
  transition: background-color 0.15s ease;
}

.qty-btn:hover:not(:disabled) {
  background-color: var(--color-sand);
}

.qty-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.qty-field {
  width: 2.5rem;
  padding: 0 0.25rem;
  text-align: center;
  font-size: 0.75rem;
  color: var(--color-charcoal);
  background-color: transparent;
  border-left: 1px solid var(--color-sand);
  border-right: 1px solid var(--color-sand);
  outline: none;
}

.qty-field::-webkit-inner-spin-button,
.qty-field::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.qty-field {
  -moz-appearance: textfield;
  appearance: textfield;
}

.return-summary {
  padding: 0.875rem 1rem;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.return-summary-title {
  margin-bottom: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
}

.return-summary-line {
  font-size: 0.8125rem;
  line-height: 1.5;
  color: color-mix(in oklab, var(--color-charcoal) 80%, transparent);
}

.return-summary-line strong {
  color: var(--color-charcoal);
}

.return-summary-section {
  margin-top: 0.625rem;
}

.return-summary-items {
  margin: 0.25rem 0 0 1.125rem;
  list-style: disc;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: color-mix(in oklab, var(--color-charcoal) 80%, transparent);
}

.return-summary-empty {
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
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

.refund-note {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
}

.refund-note-icon {
  display: inline-block;
  margin-right: 0.25rem;
  margin-bottom: -0.0625rem;
  color: var(--color-positive);
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

.tracked-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.375rem;
  margin-top: 1.5rem;
  font-variant-numeric: tabular-nums;
}

.tracked-pagination .prev,
.tracked-pagination .next,
.tracked-pagination .page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2.25rem;
  border: 1px solid var(--color-sand);
  background-color: transparent;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.tracked-pagination .prev:hover:not(:disabled),
.tracked-pagination .next:hover:not(:disabled),
.tracked-pagination .page-number:hover {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}

.tracked-pagination .prev:disabled,
.tracked-pagination .next:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.tracked-pagination .page-number[aria-current='page'] {
  border-color: var(--color-charcoal);
  background-color: var(--color-charcoal);
  color: var(--color-cream);
  font-weight: 500;
}
</style>
