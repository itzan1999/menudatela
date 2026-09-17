<script setup lang="ts">
defineProps({
  rating: { type: Number, default: 0 },
  count: { type: Number, default: 0 },
});
</script>

<template>
  <div class="flex items-center gap-1.5">
    <div class="flex items-center text-amber-700">
      <Icon v-for="i in 5" :key="i" :name="i <= Math.round(rating) ? 'ion:star' : 'ion:star-outline'" class="h-3.5 w-3.5" />
    </div>
    <span v-if="count !== undefined" class="font-sans text-xs text-[var(--color-charcoal)]/60"> ({{ count }}) </span>
  </div>
</template>
