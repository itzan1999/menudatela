<script setup lang="ts">
const showPassword = ref(false);

defineProps({
  id: { type: String, default: undefined },
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'new-password' },
  name: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue']);

const handleInputChanged = (e: Event) => {
  const target = e.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<template>
  <div class="relative flex items-center w-full">
    <input
      :id="id"
      :name="name"
      :type="showPassword ? 'text' : 'password'"
      class="h-11 w-full border border-[var(--color-sand)] bg-[var(--color-cream)] pl-3 pr-10 font-sans text-xs text-[var(--color-charcoal)] outline-none transition-colors focus:border-[var(--color-charcoal)]"
      :value="modelValue"
      :placeholder="placeholder"
      :autocomplete="autocomplete"
      :disabled="disabled"
      :required="required"
      @input="handleInputChanged" />
    <button
      type="button"
      class="absolute right-3 flex items-center text-[var(--color-charcoal)]/50 hover:text-[var(--color-charcoal)] cursor-pointer"
      :aria-label="$t(showPassword ? 'account.hidePassword' : 'account.showPassword')"
      @click="showPassword = !showPassword">
      <Icon :name="showPassword ? 'ion:eye-outline' : 'ion:eye-off-outline'" class="h-4 w-4" />
    </button>
  </div>
</template>
