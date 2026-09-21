<script setup lang="ts">
const router = useRouter();
const { formatDate, scrollToTop } = useHelpers();
const { getOrders, orders } = useAuth();

if (orders.value === null) getOrders();

const refresh = () => {
  orders.value = null;
  scrollToTop();
  getOrders();
};

const goToOrder = (databaseId?: string | number | null): void => {
  if (!databaseId) return;
  router.push(`/order-summary/${databaseId}`);
};
</script>

<template>
  <div class="orders-card flex min-h-62.5 p-4 md:p-8 justify-center items-center">
    <div v-if="orders && orders.length" class="w-full">
      <table class="w-full text-left table-auto orders-table" aria-label="Order List">
        <thead>
          <tr>
            <th>{{ $t('shop.order') }}</th>
            <th>{{ $t('general.date') }}</th>
            <th>{{ $t('general.status') }}</th>
            <th class="text-right">{{ $t('shop.total') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.orderNumber || String(order.databaseId)" class="cursor-pointer" @click="goToOrder(order.databaseId)">
            <td>{{ order.orderNumber }}</td>
            <td>{{ formatDate(order.date) }}</td>
            <td><OrderStatusLabel v-if="order.status" :order="order" /></td>
            <td class="text-right" v-html="order.total"></td>
          </tr>
        </tbody>
      </table>
      <div class="text-center flex justify-center w-full mt-8">
        <button type="button" class="refresh-btn" @click="refresh">
          <span>Refresh list</span>
          <Icon name="ion:refresh-outline" size="14" />
        </button>
      </div>
    </div>
    <div v-else-if="orders && orders.length === 0" class="min-h-62.5 flex items-center justify-center text-lg" style="color: color-mix(in oklab, var(--color-charcoal) 55%, transparent)">
      No orders found.
    </div>
    <LoadingIcon v-else size="24" stroke="2" />
  </div>
</template>

<style scoped>
.orders-card {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
}

.orders-table th {
  padding: 0.625rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
  border-bottom: 1px solid var(--color-sand);
}

.orders-table td {
  padding: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-charcoal);
  border-bottom: 1px solid var(--color-sand);
  transition: background-color 0.15s ease;
}

.orders-table tbody tr:hover td {
  background-color: color-mix(in oklab, var(--color-sand) 30%, transparent);
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--color-charcoal);
  border: 1px solid var(--color-sand);
  transition: background-color 0.2s ease;
}

.refresh-btn:hover {
  background-color: var(--color-sand);
}
</style>
