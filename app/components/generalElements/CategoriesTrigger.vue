<script setup lang="ts">
const { toggleCategories } = useCategoriesDrawer();
</script>

<template>
  <div
    class="header-icon cursor-pointer inline-flex items-center gap-1.5"
    :title="$t('shop.category', 2)"
    @click="toggleCategories(true)">
    <Icon name="ion:grid-outline" size="20" />
    <span class="categories-label hidden sm:inline">{{ $t('shop.category', 2) }}</span>
  </div>
</template>

<style scoped>
.categories-label {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}
</style>
