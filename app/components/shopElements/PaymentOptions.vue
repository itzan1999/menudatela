<script setup lang="ts">
import type { PaymentGateway, PaymentGateways } from '#types/gql';
import type { PaymentGatewayOption } from '#types/payment-gateway-plugin';

const props = defineProps<{
  modelValue: string | object;
  paymentGateways: PaymentGateways;
}>();

const { t } = useI18n();
const paymentMethod = toRef(props, 'modelValue');
const emits = defineEmits<{
  'update:modelValue': [gateway: PaymentGateway];
}>();
const gateways = computed<PaymentGateway[]>(() => props.paymentGateways?.nodes || []);
const { getGateway } = usePaymentGateways();

const selectedGatewayId = computed<string>(() => {
  const value = paymentMethod.value as PaymentGateway | string | null | undefined;
  return (typeof value === 'string' ? value : value?.id) || gateways.value[0]?.id || '';
});

const defaultGatewayOption = (gateway: PaymentGateway): PaymentGatewayOption => {
  const plugin = getGateway(gateway.id);
  const pluginIcon = plugin?.icon;
  const icon = typeof pluginIcon === 'function' ? pluginIcon(gateway) : pluginIcon || gateway.icon || null;

  return {
    id: gateway.id,
    gateway,
    title: gateway.title || plugin?.name || t('general.paymentMethod'),
    description: gateway.description,
    icon,
    iconName: plugin?.iconName || 'ion:cash-outline',
  };
};

const paymentOptions = computed<PaymentGatewayOption[]>(() => {
  return gateways.value
    .flatMap((gateway, gatewayIndex) => {
      const options = getGateway(gateway.id)?.getPaymentOptions?.(gateway) ?? [defaultGatewayOption(gateway)];
      return options.map((option, optionIndex) => ({
        ...option,
        sortOrder: option.sortOrder ?? gatewayIndex * 100 + optionIndex,
      }));
    })
    .sort((first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0));
});

const selectedOptionId = computed<string>(() => {
  const explicitlySelectedOption = paymentOptions.value.find((option) => option.isSelected);
  if (explicitlySelectedOption) return explicitlySelectedOption.id;

  return paymentOptions.value.find((option) => option.gateway.id === selectedGatewayId.value)?.id ?? '';
});

const activePaymentOption = computed<PaymentGatewayOption | null>(
  () => paymentOptions.value.find((option) => option.id === selectedOptionId.value) ?? null,
);

const isOptionSelected = (option: PaymentGatewayOption): boolean => option.id === selectedOptionId.value;

const updatePaymentMethod = async (option: PaymentGatewayOption) => {
  await option.onSelect?.();
  emits('update:modelValue', option.gateway);
};

watch(
  [gateways, selectedGatewayId],
  ([availableGateways, activeId]) => {
    if (!availableGateways.length) return;
    const matchedGateway = availableGateways.find((gateway) => gateway.id === activeId) || (availableGateways[0] as PaymentGateway);
    const value = paymentMethod.value as PaymentGateway | string | null | undefined;
    const currentId = typeof value === 'string' ? value : value?.id;

    if (typeof value === 'object' && value && currentId === matchedGateway.id) return;
    emits('update:modelValue', matchedGateway);
  },
  { immediate: true },
);
</script>

<template>
  <div class="w-full">
    <div class="grid gap-3" role="radiogroup" :aria-label="$t('billing.paymentOptions')">
      <button
        v-for="option in paymentOptions"
        :key="option.id"
        type="button"
        class="payment-option flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-none"
        :class="isOptionSelected(option) ? 'payment-option--active' : ''"
        role="radio"
        :aria-checked="isOptionSelected(option)"
        :title="option.description || option.title || $t('general.paymentMethod')"
        @click="updatePaymentMethod(option)">
        <span class="flex min-w-0 flex-1 items-center gap-3">
          <span class="grid h-6 w-6 flex-none place-items-center" aria-hidden="true">
            <NuxtImg
              v-if="option.icon"
              :src="option.icon"
              :alt="option.title || $t('general.paymentMethod')"
              width="28"
              height="24"
              class="h-5 w-6 object-contain"
              fit="contain"
              loading="lazy" />
            <icon v-else :name="option.iconName || 'ion:cash-outline'" size="22" class="payment-option-icon" />
          </span>
          <span class="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1 leading-tight">
            <span class="min-w-0 text-base font-semibold payment-option-title" v-html="option.title"></span>
            <span v-for="detail in option.details" :key="detail" class="text-base font-semibold payment-option-detail">{{ detail }}</span>
          </span>
          <span v-if="option.badge" class="ml-auto hidden flex-none text-xs font-semibold payment-option-badge sm:inline">{{ option.badge }}</span>
        </span>
        <span class="payment-option-dot grid h-4 w-4 flex-none place-items-center transition-colors" :class="{ 'payment-option-dot--active': isOptionSelected(option) }" aria-hidden="true">
          <span class="h-2 w-2 rounded-full" :class="isOptionSelected(option) ? 'opacity-100' : 'opacity-0'" style="background-color: var(--color-cream)"></span>
        </span>
      </button>
    </div>

    <div v-if="activePaymentOption?.description" class="prose block w-full mt-3">
      <p class="text-sm payment-option-detail" v-html="activePaymentOption.description"></p>
    </div>
  </div>
</template>

<style scoped>
.payment-option {
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  color: var(--color-charcoal);
}

.payment-option:hover {
  border-color: var(--color-charcoal);
}

.payment-option--active {
  border-color: var(--color-charcoal);
}

.payment-option-icon {
  color: color-mix(in oklab, var(--color-charcoal) 65%, transparent);
}

.payment-option-title {
  color: var(--color-charcoal);
}

.payment-option-detail {
  color: color-mix(in oklab, var(--color-charcoal) 60%, transparent);
}

.payment-option-badge {
  color: var(--color-charcoal);
}

.payment-option-dot {
  border-radius: 9999px;
  border: 1px solid var(--color-sand);
  background-color: var(--color-cream);
}

.payment-option-dot--active {
  border-color: var(--color-charcoal);
  background-color: var(--color-charcoal);
}
</style>
