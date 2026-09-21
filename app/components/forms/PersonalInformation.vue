<template>
  <div v-if="customer">
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="font-heading text-2xl mb-2" style="color: var(--color-charcoal)">Personal Information</h1>
      <p class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
        Manage your personal information, including your name, username and email address where you can be contacted
      </p>
    </div>

    <form class="account-form wn-form" @submit.prevent="saveChanges">
      <div class="account-form-header">
        <h3 class="font-heading text-base" style="color: var(--color-charcoal)">Personal Details</h3>
      </div>
      <!-- Form Fields -->
      <div class="grid gap-6 p-6 md:p-8 md:grid-cols-2">
        <div class="w-full space-y-2">
          <label for="first-name">{{ $t('billing.firstName') }}</label>
          <input
            id="first-name"
            v-model="customer.firstName"
            placeholder="John"
            name="first-name"
            autocomplete="given-name"
            type="text"
            autocapitalize="words" />
        </div>

        <div class="w-full space-y-2">
          <label for="last-name">{{ $t('billing.lastName') }}</label>
          <input id="last-name" v-model="customer.lastName" placeholder="Doe" name="last-name" autocomplete="family-name" type="text" autocapitalize="words" />
        </div>

        <div class="w-full space-y-2">
          <label for="username">{{ $t('account.username') }}</label>
          <input
            id="username"
            v-model="customer.username"
            placeholder="johndoe"
            name="username"
            autocomplete="username"
            type="text"
            autocapitalize="none"
            disabled />
        </div>

        <div class="w-full space-y-2">
          <label for="email">{{ $t('billing.email') }}</label>
          <input
            id="email"
            v-model="customer.email"
            placeholder="johndoe@email.com"
            name="email"
            autocomplete="email"
            type="email"
            inputmode="email"
            autocapitalize="none" />
        </div>
      </div>

      <!-- Submit Button -->
      <div class="account-form-footer">
        <button
          type="submit"
          class="save-btn ml-auto"
          :class="{ 'save-btn--success': button.state === 'success', 'save-btn--error': button.state === 'error' }"
          :disabled="loading">
          {{ button.text }}
        </button>
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

async function saveChanges() {
  if (!viewer.value?.id || !customer.value) {
    button.value = { text: t('account.failed'), state: 'error' };
    return;
  }

  loading.value = true;
  button.value.text = t('account.updating');
  const firstName = customer.value.firstName;
  const lastName = customer.value.lastName;
  try {
    const { updateCustomer } = await gql.UpdateCustomer({ input: { id: viewer.value.id, firstName, lastName } });
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
