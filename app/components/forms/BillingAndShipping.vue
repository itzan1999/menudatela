<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="font-heading text-2xl mb-2" style="color: var(--color-charcoal)">Billing & Shipping</h1>
      <p class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
        Manage your billing and shipping addresses for orders and deliveries
      </p>
    </div>

    <form class="space-y-6 wn-form" @submit.prevent="saveChanges">
      <!-- Billing Address Card -->
      <div class="account-form">
        <div class="account-form-header">
          <h3 class="font-heading text-base" style="color: var(--color-charcoal)">Billing Address</h3>
        </div>
        <!-- Billing Fields -->
        <div v-if="customer.billing" class="grid gap-6 p-6 md:p-8 md:grid-cols-2">
          <div class="w-full space-y-2">
            <label for="billing-first-name">{{ $t('billing.firstName') }}</label>
            <input
              id="billing-first-name"
              v-model="customer.billing.firstName"
              placeholder="John"
              name="billing-first-name"
              autocomplete="billing given-name"
              type="text"
              autocapitalize="words"
              required />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-last-name">{{ $t('billing.lastName') }}</label>
            <input
              id="billing-last-name"
              v-model="customer.billing.lastName"
              placeholder="Doe"
              name="billing-last-name"
              autocomplete="billing family-name"
              type="text"
              autocapitalize="words"
              required />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-phone">{{ $t('billing.phone') }}</label>
            <input
              id="billing-phone"
              v-model="customer.billing.phone"
              placeholder="+1 234 567 8901"
              name="billing-phone"
              autocomplete="billing tel"
              type="tel"
              inputmode="tel" />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-company">Company <span class="opacity-60">({{ $t('general.optional') }})</span></label>
            <input
              id="billing-company"
              v-model="customer.billing.company"
              placeholder="Company Name"
              name="billing-company"
              autocomplete="billing organization"
              type="text"
              autocapitalize="words" />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-address">{{ $t('billing.address1') }}</label>
            <input
              id="billing-address"
              v-model="customer.billing.address1"
              placeholder="123 Main St"
              name="billing-address"
              autocomplete="billing address-line1"
              type="text"
              autocapitalize="words" />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-address-2">{{ $t('billing.address2') }} <span class="opacity-60">({{ $t('general.optional') }})</span></label>
            <input
              id="billing-address-2"
              v-model="customer.billing.address2"
              placeholder="Apartment, studio, or floor"
              name="billing-address-2"
              autocomplete="billing address-line2"
              type="text"
              autocapitalize="words" />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-city">{{ $t('billing.city') }}</label>
            <input
              id="billing-city"
              v-model="customer.billing.city"
              placeholder="New York"
              name="billing-city"
              autocomplete="billing address-level2"
              type="text"
              autocapitalize="words" />
          </div>

          <div v-if="customer.billing.state && customer.billing.country" class="w-full space-y-2">
            <label for="billing-state">{{ $t('billing.state') }} <span class="opacity-60">({{ $t('general.optional') }})</span></label>
            <StateSelect
              id="billing-state"
              v-model="customer.billing.state"
              name="billing-state"
              :default-value="customer.billing.state"
              :country-code="customer.billing.country"
              autocomplete="billing address-level1" />
          </div>

          <div v-if="customer.billing.country" class="w-full space-y-2">
            <label for="billing-country">{{ $t('billing.country') }}</label>
            <CountrySelect
              id="billing-country"
              v-model="customer.billing.country"
              name="billing-country"
              :default-value="customer.billing.country"
              autocomplete="billing country" />
          </div>

          <div class="w-full space-y-2">
            <label for="billing-zip">{{ $t('billing.zip') }}</label>
            <input
              id="billing-zip"
              v-model="customer.billing.postcode"
              placeholder="10001"
              name="billing-zip"
              autocomplete="billing postal-code"
              type="text"
              autocapitalize="characters" />
          </div>

          <div class="w-full space-y-2 col-span-full">
            <label for="billing-email">{{ $t('billing.email') }}</label>
            <input
              id="billing-email"
              v-model="customer.billing.email"
              placeholder="johndoe@email.com"
              name="billing-email"
              autocomplete="billing email"
              type="email"
              inputmode="email"
              autocapitalize="none"
              required />
          </div>
        </div>
      </div>

      <!-- Shipping Address Card -->
      <div class="account-form">
        <div class="account-form-header">
          <h3 class="font-heading text-base" style="color: var(--color-charcoal)">Shipping Address</h3>
        </div>
        <!-- Shipping Fields -->
        <div v-if="customer.shipping" class="grid gap-6 p-6 md:p-8 md:grid-cols-2">
          <div class="w-full space-y-2">
            <label for="shipping-first-name">{{ $t('billing.firstName') }}</label>
            <input
              id="shipping-first-name"
              v-model="customer.shipping.firstName"
              placeholder="John"
              name="shipping-first-name"
              autocomplete="shipping given-name"
              type="text"
              autocapitalize="words"
              required />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-last-name">{{ $t('billing.lastName') }}</label>
            <input
              id="shipping-last-name"
              v-model="customer.shipping.lastName"
              placeholder="Doe"
              name="shipping-last-name"
              autocomplete="shipping family-name"
              type="text"
              autocapitalize="words"
              required />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-phone">{{ $t('billing.phone') }}</label>
            <input
              id="shipping-phone"
              v-model="customer.shipping.phone"
              placeholder="+1 234 567 8901"
              name="shipping-phone"
              autocomplete="shipping tel"
              type="tel"
              inputmode="tel" />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-company">Company <span class="opacity-60">({{ $t('general.optional') }})</span></label>
            <input
              id="shipping-company"
              v-model="customer.shipping.company"
              placeholder="Company Name"
              name="shipping-company"
              autocomplete="shipping organization"
              type="text"
              autocapitalize="words" />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-address">{{ $t('billing.address1') }}</label>
            <input
              id="shipping-address"
              v-model="customer.shipping.address1"
              placeholder="O'Connell Street 47"
              name="shipping-address"
              autocomplete="shipping address-line1"
              type="text"
              autocapitalize="words" />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-address-2">{{ $t('billing.address2') }} <span class="opacity-60">({{ $t('general.optional') }})</span></label>
            <input
              id="shipping-address-2"
              v-model="customer.shipping.address2"
              placeholder="Apartment, studio, or floor"
              name="shipping-address-2"
              autocomplete="shipping address-line2"
              type="text"
              autocapitalize="words" />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-city">{{ $t('billing.city') }}</label>
            <input
              id="shipping-city"
              v-model="customer.shipping.city"
              placeholder="New York"
              name="shipping-city"
              autocomplete="shipping address-level2"
              type="text"
              autocapitalize="words" />
          </div>

          <div v-if="customer.shipping.state && customer.shipping.country" class="w-full space-y-2">
            <label for="shipping-state">{{ $t('billing.state') }} <span class="opacity-60">({{ $t('general.optional') }})</span></label>
            <StateSelect
              id="shipping-state"
              v-model="customer.shipping.state"
              name="shipping-state"
              :default-value="customer.shipping.state"
              :country-code="customer.shipping.country"
              autocomplete="shipping address-level1" />
          </div>

          <div v-if="customer.shipping.country" class="w-full space-y-2">
            <label for="shipping-country">{{ $t('billing.country') }}</label>
            <CountrySelect
              id="shipping-country"
              v-model="customer.shipping.country"
              name="shipping-country"
              :default-value="customer.shipping?.country"
              autocomplete="shipping country" />
          </div>

          <div class="w-full space-y-2">
            <label for="shipping-zip">{{ $t('billing.zip') }}</label>
            <input
              id="shipping-zip"
              v-model="customer.shipping.postcode"
              placeholder="10001"
              name="shipping-zip"
              autocomplete="shipping postal-code"
              type="text"
              autocapitalize="characters" />
          </div>
        </div>

        <!-- Submit Button -->
        <div class="account-form-footer">
          <button type="submit" class="save-btn ml-auto" :class="{ 'save-btn--success': button.state === 'success', 'save-btn--error': button.state === 'error' }" :disabled="loading">
            {{ button.text }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
const { viewer, customer } = useAuth();
const { t } = useI18n();
const gql = useWooGraphQL();

const loading = ref<boolean>(false);
const button = ref<{ text: string; state: 'default' | 'success' | 'error' }>({ text: t('account.updateDetails'), state: 'default' });

async function saveChanges(): Promise<void> {
  if (!viewer.value?.id) return;

  loading.value = true;
  button.value.text = t('account.updating');
  const shipping = customer.value.shipping;
  const billing = customer.value.billing;

  try {
    const { updateCustomer } = await gql.UpdateCustomer({ input: { id: viewer.value.id, shipping, billing } });
    if (updateCustomer) button.value = { text: t('account.updateSuccess'), state: 'success' };
  } catch {
    button.value = { text: t('account.failed'), state: 'error' };
  }

  loading.value = false;

  setTimeout(() => {
    button.value = { text: t('account.updateDetails'), state: 'default' };
  }, 2000);
}
</script>

<style scoped>
.account-form {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.account-form-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid var(--color-sand);
}

@media (min-width: 768px) {
  .account-form-header {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.account-form-footer {
  display: flex;
  padding: 1.5rem;
  padding-top: 1rem;
  background-color: color-mix(in oklab, var(--color-sand) 35%, transparent);
  border-top: 1px solid var(--color-sand);
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
  transition: background-color 0.2s ease, color 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-btn--success {
  background-color: #2e7d32;
  border-color: #2e7d32;
  color: white;
}

.save-btn--error {
  background-color: #b91c1c;
  border-color: #b91c1c;
  color: white;
}
</style>
