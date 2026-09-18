<script setup lang="ts">
defineProps({
  node: { type: Object, required: true },
  imageLoading: { type: String as PropType<'lazy' | 'eager'>, default: 'lazy' },
});
</script>

<template>
  <NuxtLink v-if="node" :to="`/product-category/${decodeURIComponent(node.slug)}`" class="category-tile">
    <span class="category-name" v-html="node.name"></span>
    <span v-if="node.count" class="category-count">{{ node.count }} productos</span>
  </NuxtLink>
</template>

<style scoped>
.category-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  aspect-ratio: 4 / 3;
  padding: 1.5rem 1rem;
  text-align: center;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  transition:
    background-color 0.25s ease,
    border-color 0.25s ease;
}

.category-tile:hover {
  background-color: var(--color-charcoal);
  border-color: var(--color-charcoal);
}

.category-name {
  font-family: var(--font-serif);
  font-size: 1rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  transition: color 0.25s ease;
}

.category-tile:hover .category-name {
  color: var(--color-cream);
}

.category-count {
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
  transition: color 0.25s ease;
}

.category-tile:hover .category-count {
  color: color-mix(in oklab, var(--color-cream) 70%, transparent);
}
</style>
