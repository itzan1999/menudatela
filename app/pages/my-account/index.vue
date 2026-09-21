<script lang="ts" setup>
const { logoutUser, viewer, avatar, isPending, handlePostLoginRedirect } = useAuth();
const { cart } = useCart();
const route = useRoute();

const activeTab = computed(() => route.query.tab || 'personal-info');
const showLoader = computed(() => !cart.value && !viewer.value);

const isRedirecting = ref(false);

watch(viewer, (newViewer, oldViewer) => {
  if (newViewer && !oldViewer && !isRedirecting.value) {
    const redirectResult = handlePostLoginRedirect();
    if (redirectResult) {
      isRedirecting.value = true;
    }
  }
});

useSeoMeta({
  title: `My Account`,
});
</script>

<template>
  <div class="container py-8 min-h-150">
    <div v-if="showLoader || isRedirecting" class="flex flex-col min-h-125">
      <LoadingIcon class="m-auto" />
    </div>
    <template v-else>
      <LazyLoginAndRegister v-if="!viewer" />
      <div v-else class="flex flex-col items-start justify-between w-full gap-8 mb-24 lg:flex-row">
        <!-- Sidebar -->
        <aside class="w-full lg:w-72 lg:sticky lg:top-24 shrink-0">
          <!-- User Profile Card -->
          <div class="profile-card">
            <div class="flex items-center gap-4">
              <img v-if="avatar" :src="avatar" class="profile-avatar" alt="User avatar" width="56" height="56" />
              <div v-else class="profile-avatar profile-avatar--fallback">
                {{ viewer?.firstName?.charAt(0) }}{{ viewer?.lastName?.charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="profile-name">{{ viewer?.firstName }} {{ viewer?.lastName }}</div>
                <span v-if="viewer?.email" class="profile-email" :title="viewer?.email">{{ viewer?.email }}</span>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="account-nav">
            <NuxtLink to="/my-account?tab=personal-info" class="account-nav-link" :class="{ 'is-active': activeTab == 'personal-info' }">
              <Icon name="ion:person-outline" size="18" />
              <span>{{ $t('account.personalInfo') }}</span>
            </NuxtLink>
            <NuxtLink to="/my-account?tab=addresses" class="account-nav-link" :class="{ 'is-active': activeTab == 'addresses' }">
              <Icon name="ion:card-outline" size="18" />
              <span>{{ $t('billing.billingAndShipping') }}</span>
            </NuxtLink>
            <NuxtLink to="/my-account?tab=password" class="account-nav-link" :class="{ 'is-active': activeTab == 'password' }">
              <Icon name="ion:lock-closed-outline" size="18" />
              <span>{{ $t('account.password') }}</span>
            </NuxtLink>
            <div class="account-nav-divider"></div>
            <NuxtLink to="/my-account?tab=orders" class="account-nav-link" :class="{ 'is-active': activeTab == 'orders' }">
              <Icon name="ion:bag-check-outline" size="18" />
              <span>{{ $t('shop.order', 2) }}</span>
            </NuxtLink>
            <NuxtLink to="/my-account?tab=wishlist" class="account-nav-link" :class="{ 'is-active': activeTab == 'wishlist' }">
              <Icon name="ion:heart-outline" size="18" />
              <span>{{ $t('shop.wishlist') }}</span>
            </NuxtLink>
            <div class="account-nav-divider"></div>
            <NuxtLink to="/my-account?tab=settings" class="account-nav-link" :class="{ 'is-active': activeTab == 'settings' }">
              <Icon name="ion:settings-outline" size="18" />
              <span>{{ $t('account.settings') }}</span>
            </NuxtLink>
          </nav>

          <button class="logout-btn" :disabled="isPending" @click="logoutUser">
            <Icon name="ion:log-out-outline" size="16" />
            <span>{{ $t('account.logout') }}</span>
          </button>
        </aside>

        <!-- Main Content -->
        <main class="flex-1 w-full min-w-0">
          <PersonalInformation v-if="activeTab === 'personal-info'" />
          <BillingAndShipping v-else-if="activeTab === 'addresses'" />
          <ChangePassword v-else-if="activeTab === 'password'" />
          <OrderList v-else-if="activeTab === 'orders'" />
          <WishList v-else-if="activeTab === 'wishlist'" />
          <AccountSettings v-else-if="activeTab === 'settings'" />
        </main>
      </div>
    </template>
  </div>
</template>

<style scoped>
.profile-card {
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.profile-avatar {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 9999px;
  aspect-ratio: 1;
  object-fit: cover;
}

.profile-avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-serif);
  font-size: 1.25rem;
  color: var(--color-cream);
  background-color: var(--color-charcoal);
}

.profile-name {
  font-family: var(--font-serif);
  font-size: 1.0625rem;
  color: var(--color-charcoal);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-email {
  display: block;
  font-size: 0.8125rem;
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.account-nav {
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.account-nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.account-nav-link:hover {
  background-color: var(--color-sand);
  color: var(--color-charcoal);
}

.account-nav-link.is-active {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.account-nav-divider {
  height: 1px;
  margin: 0.5rem 0.25rem;
  background-color: var(--color-sand);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  background-color: transparent;
  border: 1px solid var(--color-charcoal);
  transition: background-color 0.2s ease, color 0.2s ease;
}

.logout-btn:hover:not(:disabled) {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.logout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  aside {
    position: relative !important;
    top: auto !important;
  }
}
</style>
