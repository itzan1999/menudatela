<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="font-heading text-2xl mb-2" style="color: var(--color-charcoal)">{{ $t('account.password') }}</h1>
      <p class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
        {{ $t('account.passwordDescription') }}
      </p>
    </div>

    <form class="account-form wn-form" @submit.prevent="updatePassword">
      <div class="account-form-header">
        <h3 class="font-heading text-base" style="color: var(--color-charcoal)">{{ $t('account.changePassword') }}</h3>
      </div>
      <!-- Form Fields -->
      <div class="grid p-6 md:p-8 gap-6 md:grid-cols-2">
        <input type="text" :value="viewer?.username || ''" name="username" autocomplete="username" style="display: none" />

        <div class="w-full space-y-2">
          <label for="new-password">{{ $t('account.newPassword') }}</label>
          <PasswordInput id="new-password" v-model="password.new" name="new-password" placeholder="••••••••••" autocomplete="new-password" required />
        </div>

        <div class="w-full space-y-2">
          <label for="new-password-confirm">{{ $t('account.confirmNewPassword') }}</label>
          <PasswordInput
            id="new-password-confirm"
            v-model="password.confirm"
            name="new-password-confirm"
            placeholder="••••••••••"
            autocomplete="new-password"
            required />
        </div>

        <!-- Password Requirements -->
        <div v-if="password.new" class="col-span-full info-box">
          <div class="flex items-start gap-3">
            <Icon name="ion:information-circle" size="20" class="shrink-0 mt-0.5" style="color: var(--color-charcoal); opacity: 0.6" />
            <div class="text-sm">
              <p class="font-medium mb-2" style="color: var(--color-charcoal)">{{ $t('account.passwordRequirements') }}</p>
              <ul class="space-y-1.5" style="color: color-mix(in oklab, var(--color-charcoal) 70%, transparent)">
                <li class="flex items-center gap-2">
                  <Icon
                    :name="password.new.length >= 8 ? 'ion:checkmark-circle' : 'ion:ellipse-outline'"
                    size="16"
                    :style="{ color: password.new.length >= 8 ? '#2e7d32' : 'var(--color-sand)' }" />
                  {{ $t('account.passwordMinLength') }}
                </li>
                <li class="flex items-center gap-2">
                  <Icon
                    :name="password.new === password.confirm && password.new ? 'ion:checkmark-circle' : 'ion:ellipse-outline'"
                    size="16"
                    :style="{ color: password.new === password.confirm && password.new ? '#2e7d32' : 'var(--color-sand)' }" />
                  {{ $t('account.passwordsMatch') }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <Transition name="scale-y" mode="out-in">
          <div v-if="errorMessage" class="col-span-full error-box flex items-start gap-3">
            <Icon name="ion:alert-circle" size="20" class="shrink-0 mt-0.5" style="color: #9a3b26" />
            <div class="text-sm" style="color: #7a2e1c" v-html="errorMessage"></div>
          </div>
        </Transition>
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
const { viewer, loginUser } = useAuth();
const { t } = useI18n();
const gql = useWooGraphQL();

const password = ref<{ new: string; confirm: string }>({ new: '', confirm: '' });
const loading = ref<boolean>(false);
const button = ref<{ text: string; state: 'default' | 'success' | 'error' }>({ text: t('account.updatePassword'), state: 'default' });
const errorMessage = ref<string>('');

const updatePassword = async () => {
  errorMessage.value = '';
  if (password.value.new !== password.value.confirm) {
    errorMessage.value = t('error.passwordMismatch');
    return;
  }

  if (!viewer.value?.id || !viewer.value?.username) {
    errorMessage.value = t('error.general');
    return;
  }

  try {
    loading.value = true;
    const { updateCustomer } = await gql.UpdateCustomer({ input: { id: viewer.value.id, password: password.value.new } });
    if (updateCustomer) {
      button.value = { text: t('account.updateSuccess'), state: 'success' };
      const { success, error } = await loginUser({ username: viewer.value.username, password: password.value.new });
      if (error) {
        errorMessage.value = error;
        button.value = { text: t('account.failed'), state: 'error' };
      }
      if (success) {
        password.value = { new: '', confirm: '' };
      }
    }
  } catch (error) {
    console.error(error);
    const gqlError = (error as { gqlErrors?: Array<{ message?: string }> } | null)?.gqlErrors?.[0]?.message;
    errorMessage.value = gqlError || t('error.tryAgain');
    button.value = { text: t('account.failed'), state: 'error' };
  }

  loading.value = false;

  setTimeout(() => {
    button.value = { text: t('account.updatePassword'), state: 'default' };
  }, 2000);
};
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

.info-box {
  padding: 1rem;
  background-color: color-mix(in oklab, var(--color-sand) 40%, transparent);
  border: 1px solid var(--color-sand);
}

.error-box {
  padding: 1rem;
  background-color: #fdf1ee;
  border: 1px solid #f3c9bd;
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
