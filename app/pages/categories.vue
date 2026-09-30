<script setup lang="ts">
// The categories listing lives in the CategoriesDrawer now (opened from the nav), so this route
// only exists to send old bookmarks/links somewhere real instead of 404ing.
await navigateTo('/products', { redirectCode: 301 });
</script>

<template>
  <div></div>
</template>
