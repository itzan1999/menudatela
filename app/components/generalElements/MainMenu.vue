<script setup lang="ts">
const { navigateToLogin } = useAuth();
const route = useRoute();
</script>

<template>
  <nav>
    <NuxtLink class="nav-link" to="/">{{ $t('general.home') }}</NuxtLink>
    <NuxtLink class="nav-link" to="/products">{{ $t('general.products') }}</NuxtLink>
    <NuxtLink class="nav-link" to="/categories">{{ $t('shop.category', 2) }}</NuxtLink>
    <NuxtLink class="nav-link" to="/contact">{{ $t('general.contact') }}</NuxtLink>
    <NuxtLink class="nav-link lg:hidden" to="/wishlist" :prefetch="false">{{ $t('shop.wishlist') }}</NuxtLink>
    <NuxtLink class="nav-link lg:hidden" to="/my-account" :prefetch="false" @click="navigateToLogin(route.fullPath)">{{ $t('account.myAccount') }}</NuxtLink>
  </nav>
</template>

<style scoped>
.nav-link {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-charcoal);
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-active {
  opacity: 1;
}
</style>
