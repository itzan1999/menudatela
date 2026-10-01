import type { Ref } from 'vue';

// Plain client-side pager for a list already loaded in full — see SimplePagination.vue for the
// matching UI. Pull out here because shipping-returns.vue and WishList.vue both needed the exact
// same page/totalPages/paged shape (including the same clamp-on-shrink edge case), and two copies
// of identical logic is the kind of thing that gets fixed in one place and quietly rots in the
// other.
export function usePagination<T>(items: Ref<T[]>, perPage: number) {
  const page = ref(1);
  const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / perPage)));
  const paged = computed(() => {
    const start = (page.value - 1) * perPage;
    return items.value.slice(start, start + perPage);
  });

  // The list can only ever be refreshed shorter, never longer, mid-session — clamping down is the
  // only direction needed, e.g. if the viewer was sitting on a later page and the list came back
  // shorter (an item removed, a refresh with fewer results).
  watch(totalPages, (total) => {
    if (page.value > total) page.value = total;
  });

  return { page, totalPages, paged };
}
