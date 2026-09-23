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
  position: relative;
  text-decoration: none;
  padding: 0.3rem 0;
  margin: 0 1rem;
}

.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 2px;
  opacity: 0.7;
  background: var(--color-charcoal);
  transform: scaleX(0);
  transform-origin: center;
  transition: transform 0.3s ease;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  transform: scaleX(1);
}

/* .nav-link:hover,
.nav-link.router-link-active {
  opacity: 1;
} */

.nav-link.router-link-active,
.nav-link.router-link-active::after {
  opacity: 1;
  color: var(--color-charcoal);
  font-weight: bold;
}
</style>
