<script setup lang="ts">
const { viewer, avatar, logoutUser, isPending, navigateToLogin } = useAuth();
const route = useRoute();

const { t } = useI18n();
const linkTitle = computed<string>(() => viewer.value?.username || t('account.signIn'));
</script>

<template>
  <div class="hidden sm:inline-flex aspect-square items-center">
    <Transition name="pop-in" mode="out-in">
      <div v-if="viewer" class="relative avatar">
        <NuxtLink to="/my-account" :title="linkTitle" class="inline-flex items-center header-icon">
          <img
            v-if="avatar"
            :src="avatar"
            class="rounded-full transform scale-125 shadow-md overflow-hidden border border-white my-auto"
            width="22"
            height="22"
            :alt="linkTitle" />
          <Icon v-else name="ion:person-outline" size="20" />
        </NuxtLink>
        <div class="account-dropdown font-medium">
          <Button to="/my-account" size="sm" variant="ghost" class="dropdown-item" icon="ion:person">{{ $t('account.myAccount') }}</Button>
          <Button to="/wishlist" size="sm" variant="ghost" class="dropdown-item" icon="ion:heart">{{ $t('shop.wishlist') }}</Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            class="dropdown-item dropdown-item--danger"
            icon="ion:log-out"
            :loading="isPending"
            @click.stop="logoutUser">
            {{ $t('account.logout') }}
          </Button>
        </div>
      </div>
      <NuxtLink v-else to="/my-account" :title="linkTitle" class="inline-flex items-center header-icon" @click="navigateToLogin(route.fullPath)">
        <Icon name="ion:person-outline" size="20" />
      </NuxtLink>
    </Transition>
  </div>
</template>

<style scoped>
.header-icon {
  color: var(--color-charcoal);
  opacity: 0.75;
  transition: opacity 0.2s ease;
}

.header-icon:hover {
  opacity: 1;
}

.pop-in-enter-active,
.pop-in-leave-active {
  transition: transform 0.3s;
}

.pop-in-enter-from,
.pop-in-leave-to {
  transform: scale(0);
}

.avatar {
  position: relative;
}

.account-dropdown {
  display: none;
  position: absolute;
  top: 1.5rem;
  right: -0.5rem;
  z-index: 50;
  gap: 0.25rem;
  padding: 0.25rem;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  border-radius: 0.5rem;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  font-size: 0.875rem;
  color: var(--color-charcoal);
}

.avatar:hover .account-dropdown {
  display: grid;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
  white-space: nowrap;
  min-width: 12.5rem;
}

.dropdown-item:hover {
  background-color: var(--color-sand);
}

.dropdown-item--danger {
  color: #dc2626;
}

.dropdown-item--danger:hover {
  background-color: #fef2f2;
}
</style>
