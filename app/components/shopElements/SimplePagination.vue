<script setup lang="ts">
// Plain client-side pager for a list already loaded in full (no route/page-number navigation) —
// for listings backed by a server-paginated route instead, use Pagination.vue.
defineProps<{ page: number; totalPages: number }>();
const emit = defineEmits<{ 'update:page': [page: number] }>();
</script>

<template>
  <nav v-if="totalPages > 1" class="simple-pagination" :aria-label="$t('general.pagination')">
    <button type="button" class="prev" :disabled="page === 1" :aria-label="$t('general.previous')" @click="emit('update:page', page - 1)">
      <Icon name="ion:chevron-back-outline" size="16" class="w-4 h-4" />
    </button>

    <button
      v-for="pageNumber in totalPages"
      :key="pageNumber"
      type="button"
      class="page-number"
      :aria-current="pageNumber === page ? 'page' : undefined"
      @click="emit('update:page', pageNumber)">
      {{ pageNumber }}
    </button>

    <button type="button" class="next" :disabled="page === totalPages" :aria-label="$t('general.next')" @click="emit('update:page', page + 1)">
      <Icon name="ion:chevron-forward-outline" size="16" class="w-4 h-4" />
    </button>
  </nav>
</template>

<style scoped>
.simple-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.375rem;
  margin-top: 2.5rem;
  font-variant-numeric: tabular-nums;
}

.simple-pagination .prev,
.simple-pagination .next,
.simple-pagination .page-number {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 2.25rem;
  width: 2.25rem;
  border: 1px solid var(--color-sand);
  background-color: transparent;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;
}

.simple-pagination .prev:hover:not(:disabled),
.simple-pagination .next:hover:not(:disabled),
.simple-pagination .page-number:hover {
  border-color: var(--color-charcoal);
  color: var(--color-charcoal);
}

.simple-pagination .prev:disabled,
.simple-pagination .next:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.simple-pagination .page-number[aria-current='page'] {
  border-color: var(--color-charcoal);
  background-color: var(--color-charcoal);
  color: var(--color-cream);
  font-weight: 500;
}
</style>
