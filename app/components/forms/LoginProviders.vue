<script setup lang="ts">
import { LoginProviderEnum } from '#gql/default';
import type { LoginClient } from '#types/gql';

const { loginClients, loginWithProvider } = useAuth();
const route = useRoute();
const router = useRouter();
const { storeSettings } = useAppConfig();

const { provider, code, state } = route.query as { provider?: string; code?: string; state?: string };
if (code && state && provider) {
  loginWithProvider(state, code, provider.toUpperCase())
    .then(() => {
      router.replace({ query: {} });
    })
    .catch((error) => {
      console.error('Login failed:', error);
    });
}

const providerIcons = {
  FACEBOOK: 'ion:logo-facebook',
  GITHUB: 'ion:logo-github',
  GOOGLE: 'ion:logo-google',
  INSTAGRAM: 'ion:logo-instagram',
  LINKEDIN: 'ion:logo-linkedin',
};

const socialLoginsDisplay = storeSettings?.socialLoginsDisplay || 'buttons';
const socialLoginProviders = computed(
  () => loginClients.value?.filter((loginClient: LoginClient) => loginClient?.provider !== LoginProviderEnum.Password) || [],
);

const labelFallback = (providerName?: LoginProviderEnum | null) => {
  if (!providerName) return 'Acceder';
  return `Acceder con ${providerName.charAt(0).toUpperCase() + providerName.slice(1).toLowerCase()}`;
};
</script>

<template>
  <div v-if="socialLoginProviders?.length">
    <div class="gap-3" :class="socialLoginsDisplay === 'buttons' ? 'grid grid-cols-1 gap-2' : 'flex flex-wrap justify-center gap-3'">
      <div v-for="(loginClient, index) in socialLoginProviders" :key="index">
        <NuxtLink
          v-if="loginClient && loginClient?.authorizationUrl"
          :to="loginClient?.authorizationUrl"
          class="flex h-11 items-center justify-center gap-2 border border-[var(--color-sand)] bg-[var(--color-cream)] px-4 font-sans text-xs text-[var(--color-charcoal)] transition-colors hover:border-[var(--color-charcoal)]">
          <Icon v-if="loginClient.provider" :name="providerIcons[loginClient.provider as keyof typeof providerIcons]" class="h-4 w-4" />
          <Icon v-else name="ion:log-in" class="h-4 w-4" />
          <span>{{ loginClient.name || labelFallback(loginClient.provider) }}</span>
        </NuxtLink>
      </div>
    </div>

    <!-- Divisor "o bien con email" -->
    <div class="my-6 flex items-center gap-3">
      <div class="flex-1 border-b border-[var(--color-sand)]"></div>
      <span class="font-sans text-[11px] uppercase tracking-wider text-[var(--color-charcoal)]/50">
        {{ $t('account.orContinueWithEmail') }}
      </span>
      <div class="flex-1 border-b border-[var(--color-sand)]"></div>
    </div>
  </div>
</template>
