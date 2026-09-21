<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n();

const settings = ref({
  preferences: {
    language: locale.value,
  },
  notifications: {
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    priceDrops: true,
    backInStock: true,
    smsNotifications: false,
    emailDigest: 'instant',
  },
});

const languages = computed(() => {
  return locales.value.map((loc: any) => ({
    value: loc.code,
    label: loc.name,
  }));
});

const saving = ref(false);
const successMessage = ref(false);

watch(
  () => settings.value.preferences.language,
  async (newLanguage) => {
    if (newLanguage !== locale.value) {
      await setLocale(newLanguage);
    }
  },
);

const saveSettings = async () => {
  saving.value = true;

  if (settings.value.preferences.language !== locale.value) {
    await setLocale(settings.value.preferences.language);
  }

  await new Promise((resolve) => setTimeout(resolve, 800));

  saving.value = false;
  successMessage.value = true;

  setTimeout(() => {
    successMessage.value = false;
  }, 3000);
};

const deleteAccount = () => {
  if (confirm(t('account.deleteConfirmation'))) {
    alert(t('account.deleteUnavailable'));
  }
};
</script>

<template>
  <div>
    <!-- Page Header -->
    <div class="mb-8">
      <h1 class="font-heading text-2xl mb-2" style="color: var(--color-charcoal)">{{ $t('account.settings') }}</h1>
      <p class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 65%, transparent)">
        {{ $t('account.settingsDescription') }}
      </p>
    </div>

    <form class="space-y-6 wn-form" @submit.prevent="saveSettings">
      <!-- Preferences Section -->
      <div class="account-form">
        <div class="account-form-header">
          <h3 class="font-heading text-base" style="color: var(--color-charcoal)">{{ $t('account.preferences') }}</h3>
        </div>

        <div class="p-6 md:p-8 space-y-6">
          <!-- Language -->
          <div class="space-y-2">
            <label for="language">{{ $t('general.language') }}</label>
            <select id="language" v-model="settings.preferences.language">
              <option v-for="lang in languages" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
            </select>
          </div>
        </div>
      </div>
    </form>

    <!-- Danger Zone -->
    <div class="danger-zone mt-12">
      <div class="danger-zone-header">
        <h3 class="font-heading text-base" style="color: #7a2e1c">{{ $t('account.dangerZone') }}</h3>
      </div>
      <div class="p-6 md:p-8">
        <div class="flex items-center justify-between gap-6">
          <div class="flex items-start gap-3 flex-1">
            <div class="danger-icon shrink-0">
              <Icon name="ion:warning-outline" size="18" style="color: #9a3b26" />
            </div>
            <div>
              <h4 class="font-medium mb-1" style="color: var(--color-charcoal)">{{ $t('account.deleteAccount') }}</h4>
              <p class="text-sm" style="color: color-mix(in oklab, var(--color-charcoal) 60%, transparent)">
                {{ $t('account.deleteAccountDescription') }}
              </p>
            </div>
          </div>
          <button type="button" class="delete-btn" @click="deleteAccount">
            <Icon name="ion:trash-outline" size="14" />
            <span>{{ $t('general.delete') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

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

.danger-zone {
  background-color: var(--color-cream);
  border: 1px solid #f3c9bd;
  overflow: hidden;
}

.danger-zone-header {
  padding: 1.5rem 1.5rem 1rem;
  background-color: #fdf1ee;
  border-bottom: 1px solid #f3c9bd;
}

@media (min-width: 768px) {
  .danger-zone-header {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

.danger-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  background-color: #fdf1ee;
}

.delete-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #9a3b26;
  background-color: transparent;
  border: 1px solid #9a3b26;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.delete-btn:hover {
  background-color: #9a3b26;
  color: white;
}
</style>
