<script setup lang="ts">
const { toggleMobileMenu } = useHelpers();
</script>

<template>
  <div class="fixed top-0 bottom-0 left-0 z-50 flex flex-col w-11/12 max-w-lg overflow-x-hidden mobile-menu-drawer">
    <Icon
      name="ion:close-outline"
      class="absolute p-1 rounded-lg top-6 left-6 md:left-8 cursor-pointer close-icon"
      size="34"
      @click="toggleMobileMenu(false)" />

    <div class="mt-8 text-center drawer-title">{{ $t('general.menu') }}</div>

    <MainMenu class="mt-10 flex flex-col items-start gap-5 px-8" />
  </div>
</template>

<style scoped>
.mobile-menu-drawer {
  background-color: var(--color-cream);
  box-shadow: 10px 0 30px -10px rgba(0, 0, 0, 0.15);
}

.close-icon {
  color: var(--color-charcoal);
  opacity: 0.75;
  transition: opacity 0.2s ease;
}

.close-icon:hover {
  opacity: 1;
  background-color: var(--color-sand);
}

.drawer-title {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  color: var(--color-charcoal);
}
</style>
