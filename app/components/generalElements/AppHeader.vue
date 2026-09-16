<script setup lang="ts">
const { isShowingSearch } = useSearching();
</script>

<template>
  <header class="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-sand">
    <div class="container flex items-center justify-between py-6">
      <!-- Hook: Before header navigation -->
      <HookOutlet name="layout.header.beforeNav" as="div" />

      <div class="flex items-center">
        <MenuTrigger class="lg:hidden" />
        <Logo class="w-40" />
      </div>
      <MainMenu class="items-center hidden gap-8 lg:flex lg:px-4" />
      <div class="flex justify-end items-center w-40 flex-1 ml-auto gap-4 md:gap-6">
        <ProductSearch class="hidden sm:inline-flex max-w-80 w-[60%]" />
        <SearchTrigger />
        <div class="flex gap-4 items-center">
          <SignInLink />
          <CartTrigger />
        </div>
      </div>
    </div>
    <Transition name="scale-y" mode="out-in">
      <div v-if="isShowingSearch" class="container mb-3 -mt-1 sm:hidden">
        <ProductSearch class="flex w-full" />
      </div>
    </Transition>
  </header>
</template>
