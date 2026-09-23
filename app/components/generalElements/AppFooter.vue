<script setup lang="ts">
const { wooNuxtVersionInfo } = useHelpers();
</script>

<template>
  <footer class="footer-dark order-last">
    <div class="container flex flex-wrap justify-between gap-12 my-24 md:gap-24">
      <div class="mr-auto footer-brand">
        <Logo />
        <WebsiteShortDescription />
        <div class="inline-flex gap-2 justify-start mt-8">
          <LangSwitcher />
        </div>
      </div>
      <div class="w-[42.857%] lg:w-auto">
        <div class="footer-heading">{{ $t('general.information') }}</div>
        <div class="footer-links">
          <a class="footer-link" href="https://github.com/scottyzen/woonuxt?tab=readme-ov-file#next-generation-front-end-for-woocommerce" target="_blank">{{
            $t('general.about')
          }}</a>
          <a href="https://woonuxt.com/faq" class="footer-link" rel="noreferrer" target="_blank">FAQ's</a>
        </div>
      </div>
      <!-- <div class="w-[42.857%] lg:w-auto">
        <div class="footer-heading">{{ $t('general.products') }}</div>
        <div class="footer-links">
          <NuxtLink to="/products" class="footer-link">{{ $t('shop.newArrivals') }}</NuxtLink>
          <NuxtLink to="/products?filter=sale[true]" class="footer-link">{{ $t('shop.onSale') }}</NuxtLink>
          <NuxtLink to="/products?orderby=rating&order=ASC&filter=rating[1]" class="footer-link">{{ $t('shop.topRated') }}</NuxtLink>
        </div>
      </div> -->
      <div class="w-[42.857%] lg:w-auto">
        <div class="footer-heading">{{ $t('general.customerService') }}</div>
        <div class="footer-links">
          <NuxtLink to="/contact" class="footer-link">{{ $t('general.contactUs') }}</NuxtLink>
          <NuxtLink to="/shipping-returns" class="footer-link">{{ $t('general.shippingReturns') }}</NuxtLink>
        </div>
      </div>
      <!-- <div class="w-[42.857%] lg:w-auto">
        <div class="footer-heading">{{ $t('account.myAccount') }}</div>
        <div class="footer-links">
          <NuxtLink to="/my-account/" class="footer-link">{{ $t('account.myAccount') }}</NuxtLink>
          <NuxtLink to="/my-account/?tab=orders" class="footer-link">{{ $t('shop.orderHistory') }}</NuxtLink>
          <NuxtLink to="/wishlist" class="footer-link">{{ $t('shop.wishlist') }}</NuxtLink>
        </div>
      </div> -->
      <div class="w-[42.857%] lg:w-auto">
        <div class="footer-heading">{{ $t('general.legal') }}</div>
        <div class="footer-links">
          <NuxtLink to="/legal?tab=cookies" class="footer-link">{{ $t('general.cookiesPolicy') }}</NuxtLink>
          <NuxtLink to="/legal?tab=terminos" class="footer-link">{{ $t('general.termsConditions') }}</NuxtLink>
          <NuxtLink to="/legal?tab=privacidad" class="footer-link">{{ $t('general.privacyPolicy') }}</NuxtLink>
          <NuxtLink to="/legal?tab=aviso-legal" class="footer-link">{{ $t('general.legalNotice') }}</NuxtLink>
        </div>
      </div>
    </div>
    <div class="container">
      <div class="footer-bottom flex items-center justify-center mb-6">
        <div class="copywrite">
          <p class="py-4 text-xs text-center footer-credit">
            <a href="https://woonuxt.com" :title="`Built with WooNuxt v${wooNuxtVersionInfo}`" target="_blank">Built with WooNuxt v{{ wooNuxtVersionInfo }}</a>
          </p>
        </div>
        <SocialIcons class="ml-auto" />
      </div>
    </div>

    <!-- Hook: Bottom of footer -->
    <HookOutlet name="layout.footer.bottom" as="div" />
  </footer>
</template>

<style scoped>
.footer-dark {
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.footer-brand :deep(*) {
  color: color-mix(in oklab, var(--color-cream) 88%, transparent);
}

.footer-brand :deep(.wordmark) {
  color: var(--color-cream);
}

.footer-heading {
  margin-bottom: 1rem;
  font-family: var(--font-serif);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-cream);
}

.footer-links {
  display: flex;
  flex-direction: column;
  font-size: 0.875rem;
}

.footer-link {
  display: block;
  padding: 0.375rem 0;
  color: color-mix(in oklab, var(--color-cream) 65%, transparent);
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--color-cream);
  text-decoration: none;
}

.footer-bottom {
  border-top: 1px solid color-mix(in oklab, var(--color-cream) 15%, transparent);
  padding-top: 0.5rem;
}

.footer-credit {
  color: color-mix(in oklab, var(--color-cream) 45%, transparent);
}

.footer-credit a:hover {
  color: var(--color-cream);
}
</style>
