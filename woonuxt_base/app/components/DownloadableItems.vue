<script setup lang="ts">
import type { DownloadableItem } from '#types/gql';

const { formatDate } = useHelpers();

const props = defineProps({
  downloadableItems: { type: Array as PropType<DownloadableItem[]>, default: () => [] },
});

const getDownloadHref = (item: DownloadableItem & { downloadUrl?: string | null }): string | null => item.downloadUrl || item.url || null;
</script>

<template>
  <table class="w-full text-left table-auto" aria-label="Download List">
    <thead>
      <tr>
        <th>{{ $t('general.product') }}</th>
        <th>{{ $t('shop.downloadsRemaining') }}</th>
        <th>{{ $t('shop.expires') }}</th>
        <th>{{ $t('general.download') }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="item in props.downloadableItems" :key="item.id">
        <td>
          <NuxtLink v-if="item.product" :to="`/product/${item.product.slug}`" class="download-link">{{ item.product.name }}</NuxtLink>
        </td>
        <td>{{ item.downloadsRemaining || '∞' }}</td>
        <td>{{ item.accessExpires ? formatDate(item.accessExpires) : 'Never' }}</td>
        <td v-if="getDownloadHref(item)">
          <a :href="getDownloadHref(item) || undefined" :download="item.name" class="download-link">{{ item.name }}</a>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
@reference "#tailwind";

thead tr {
  @apply text-xs sm:text-base;
  border-bottom: 1px solid var(--color-sand);
  color: var(--color-charcoal);
}

tbody tr {
  @apply text-xs sm:text-sm;
  border-bottom: 1px solid var(--color-sand);
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.download-link {
  color: var(--color-charcoal);
}

.download-link:hover {
  text-decoration: underline;
}

td,
th {
  @apply py-2 px-3;
}
</style>
