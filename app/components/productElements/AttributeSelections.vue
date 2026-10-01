<script setup lang="ts">
import type { ProductAttribute, ProductVariationFragment, VariationAttribute } from '#types/gql';

interface Props {
  attributes: ProductAttribute[];
  defaultAttributes?: { nodes: VariationAttribute[] } | null;
  variations?: ProductVariationFragment[] | null;
}

const { attributes, defaultAttributes, variations } = defineProps<Props>();
const emit = defineEmits(['attrs-changed']);

const selections = ref<Record<string, string>>({});

const primaryAttribute = computed(() => {
  if (!attributes?.length) return null;
  return attributes.find((attr) => ['pa_color', 'color'].includes(attr?.name || '')) ?? attributes[0];
});

const primarySelection = computed(() => {
  const primary = primaryAttribute.value;
  const name = primary?.name || '';
  if (!name) return '';
  return selections.value[name] ?? '';
});

const normalizeMatchToken = (name?: string | null): string =>
  (name ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[\s-_]+/g, '');

const stripPaPrefix = (name?: string | null): string =>
  (name ?? '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^pa[_-]/, '');

const normalizeMatchKey = (name?: string | null): string => normalizeMatchToken(stripPaPrefix(name));

const normalizeMatchValue = (value?: string | null): string => normalizeMatchToken(value);

const toSelectionName = (name?: string | null): string => {
  if (!name) return '';
  return name.charAt(0).toLowerCase() + name.slice(1);
};

const toHintLabel = (label?: string | null): string => (label ?? '').toString().trim().toLowerCase();

const getSelectionHint = (attr: ProductAttribute): string => {
  const primary = primaryAttribute.value;
  if (!primary || primary === attr) return '';
  if (primarySelection.value) return '';

  const primaryLabel = toHintLabel(primary.label ?? primary.name);
  const attrLabel = toHintLabel(attr.label ?? attr.name);
  if (!primaryLabel || !attrLabel) return '';

  return `Select ${primaryLabel} to see available ${attrLabel}`;
};

const getSelectedName = (attr: ProductAttribute, value?: string) => {
  if (!value) return '';
  if ('terms' in attr && attr?.terms?.nodes?.length) {
    return attr.terms.nodes.find((node: { slug?: string | null; name?: string | null }) => node?.slug === value)?.name ?? value;
  }

  return value;
};

const emitSelection = () => {
  const selectedVariations = attributes.map((row): VariationAttribute => ({
    name: toSelectionName(row?.name),
    value: selections.value[row?.name ?? ''] ?? '',
    attributeId: null,
    label: row?.label ?? row?.name ?? '',
  }));

  emit('attrs-changed', selectedVariations);
};

const buildSelectionMap = (source: Record<string, string>, excludeName?: string): Record<string, string> => {
  const map: Record<string, string> = {};
  Object.entries(source).forEach(([key, value]) => {
    if (excludeName && key === excludeName) return;
    const normalizedKey = normalizeMatchKey(key);
    const normalizedValue = normalizeMatchValue(value);
    if (!normalizedKey || !normalizedValue) return;
    map[normalizedKey] = normalizedValue;
  });
  return map;
};

const normalizedVariations = computed(() => {
  if (!variations?.length) return [];
  return variations.map((variation) => {
    const attrs: Record<string, string> = {};
    variation?.attributes?.nodes?.forEach((attr: VariationAttribute) => {
      const key = normalizeMatchKey(attr.name);
      if (!key) return;
      attrs[key] = normalizeMatchValue(attr.value);
    });
    const specificity = Object.values(attrs).filter(Boolean).length;
    return { variation, attrs, specificity };
  });
});

const isOptionEnabled = (attrName: string, optionValue: string, source: Record<string, string> = selections.value): boolean => {
  if (!variations?.length) return true;
  const attrKey = normalizeMatchKey(attrName);
  const optionKey = normalizeMatchValue(optionValue);
  if (!attrKey || !optionKey) return true;

  const selectedMap = buildSelectionMap(source, attrName);

  return normalizedVariations.value.some((candidate) => {
    for (const [key, value] of Object.entries(selectedMap)) {
      const candidateValue = candidate.attrs[key];
      if (!candidateValue) continue;
      if (candidateValue !== value) return false;
    }

    const candidateAttrValue = candidate.attrs[attrKey];
    if (!candidateAttrValue) return true;
    return candidateAttrValue === optionKey;
  });
};

const matchesSelection = (candidateAttrs: Record<string, string>, source: Record<string, string>): boolean => {
  const selectedMap = buildSelectionMap(source);
  if (Object.keys(selectedMap).length === 0) return true;

  for (const [key, value] of Object.entries(selectedMap)) {
    const candidateValue = candidateAttrs[key];
    if (!candidateValue) continue;
    if (candidateValue !== value) return false;
  }

  return true;
};

const hasValidCombination = (source: Record<string, string>): boolean => {
  if (!variations?.length) return true;
  return normalizedVariations.value.some((candidate) => matchesSelection(candidate.attrs, source));
};

const findBestVariationForSelection = (source: Record<string, string>, requiredKey?: string): ProductVariationFragment | null => {
  if (!variations?.length) return null;
  const selectedMap = buildSelectionMap(source);
  if (requiredKey && !selectedMap[requiredKey]) return null;

  let best: { variation: ProductVariationFragment; score: number } | null = null;

  for (const candidate of normalizedVariations.value) {
    if (requiredKey) {
      const requiredValue = selectedMap[requiredKey];
      const candidateValue = candidate.attrs[requiredKey];
      if (candidateValue && candidateValue !== requiredValue) continue;
    }

    let matches = true;
    let matchedSpecific = 0;
    let mismatchedSpecific = 0;

    for (const [key, value] of Object.entries(selectedMap)) {
      const candidateValue = candidate.attrs[key];
      if (!candidateValue) continue;
      if (candidateValue !== value) {
        if (!requiredKey || key === requiredKey) {
          matches = false;
          break;
        }
        mismatchedSpecific += 1;
        continue;
      }
      if (candidateValue === value) matchedSpecific += 1;
    }

    if (!matches) continue;

    const score = matchedSpecific * 100 + candidate.specificity - mismatchedSpecific * 10;
    if (!best || score > best.score) {
      best = { variation: candidate.variation, score };
    }
  }

  return best?.variation ?? null;
};

const applyVariationSelections = (variation: ProductVariationFragment, source: Record<string, string>): Record<string, string> => {
  if (!variation?.attributes?.nodes) return source;

  const next = { ...source };
  const attrNodes = variation.attributes?.nodes;
  if (!attrNodes) return next;
  attributes.forEach((attr) => {
    const key = attr?.name ?? '';
    if (!key) return;

    const matchKey = normalizeMatchKey(key);
    const matchingAttr = attrNodes.find((variationAttr: VariationAttribute) => normalizeMatchKey(variationAttr.name) === matchKey);
    if (!matchingAttr) return;

    next[key] = matchingAttr.value ?? '';
  });

  return next;
};

const getAttributeOptions = (attr: ProductAttribute): string[] =>
  attr.scope === 'LOCAL'
    ? (attr.options ?? []).filter((option): option is string => !!option)
    : ('terms' in attr ? (attr.terms?.nodes ?? []) : []).map((term) => term?.slug).filter((slug): slug is string => !!slug);

const resolveInvalidSelections = (source: Record<string, string>, options: { allowEmpty?: boolean; preferClear?: boolean } = {}): Record<string, string> => {
  const allowEmpty = options.allowEmpty ?? true;
  const preferClear = options.preferClear ?? true;
  let next = { ...source };
  let changed = true;
  let guard = 0;

  while (changed && guard < 5) {
    guard += 1;
    changed = false;

    attributes.forEach((attr) => {
      const key = attr?.name ?? '';
      if (!key) return;

      const currentValue = next[key];
      if (currentValue && isOptionEnabled(key, currentValue, next)) return;
      if (!currentValue && allowEmpty) return;

      const fallback = getAttributeOptions(attr).find((option) => isOptionEnabled(key, option, next)) ?? '';
      const nextValue = preferClear && currentValue ? '' : fallback;
      if (nextValue !== currentValue) {
        next = { ...next, [key]: nextValue };
        changed = true;
      }
    });
  }

  return next;
};

const handleSelectionChange = (changedKey?: string) => {
  if (!variations?.length) {
    emitSelection();
    return;
  }

  if (hasValidCombination(selections.value)) {
    emitSelection();
    return;
  }

  const requiredKey = changedKey ? normalizeMatchKey(changedKey) : undefined;
  const best = findBestVariationForSelection(selections.value, requiredKey);
  if (best) {
    selections.value = applyVariationSelections(best, selections.value);
    emitSelection();
    return;
  }

  const resolved = resolveInvalidSelections(selections.value, { allowEmpty: true, preferClear: true });
  const resolvedKeys = Object.keys(resolved);
  const currentKeys = Object.keys(selections.value);
  const hasChanges = resolvedKeys.length !== currentKeys.length || resolvedKeys.some((key) => selections.value[key] !== resolved[key]);

  if (hasChanges) {
    selections.value = resolved;
  }

  emitSelection();
};

const setInitialSelections = () => {
  const defaults = new Map<string, string>();
  defaultAttributes?.nodes?.forEach((attr: VariationAttribute) => {
    const key = normalizeMatchKey(attr.name);
    if (key) defaults.set(key, attr.value ?? '');
  });

  const nextSelections: Record<string, string> = { ...selections.value };
  attributes.forEach((attr) => {
    const key = attr?.name ?? '';
    if (!key) return;

    const matchKey = normalizeMatchKey(key);
    const defaultValue = defaults.get(matchKey);
    if (defaultValue !== undefined) {
      nextSelections[key] = defaultValue ?? '';
      return;
    }

    // No admin-configured default for this attribute — if it only ever offered a single option
    // (e.g. a product that only comes in one color), there's nothing to actually choose between,
    // so pick it automatically instead of leaving that picker sitting unselected.
    const options = getAttributeOptions(attr);
    if (options.length === 1) {
      nextSelections[key] = options[0] ?? '';
    }
  });

  const resolved = resolveInvalidSelections(nextSelections, { allowEmpty: true, preferClear: true });
  const currentKeys = Object.keys(selections.value);
  const resolvedKeys = Object.keys(resolved);
  const hasChanges = currentKeys.length !== resolvedKeys.length || resolvedKeys.some((key) => selections.value[key] !== resolved[key]);

  if (!hasChanges) return;

  selections.value = resolved;
  emitSelection();
};

const className = (name: string) => (name ? `name-${name.toLowerCase().split(' ').join('-')}` : '');

watch(
  () => [attributes, defaultAttributes, variations],
  () => setInitialSelections(),
  { deep: true, immediate: true },
);
</script>

<template>
  <div v-if="attributes" class="flex flex-col gap-5 attribute-selections">
    <div v-for="(attr, i) in attributes" :key="i" class="relative">
      <!-- LOCAL -->
      <div v-if="attr.scope == 'LOCAL'" class="flex flex-col gap-2">
        <div class="attr-label">
          {{ attr.label || attr.name }}
          <span v-if="selections[attr.name || '']"
            >: <span class="attr-value">{{ getSelectedName(attr, selections[attr.name || '']) }}</span></span
          >
        </div>
        <!-- <div v-if="getSelectionHint(attr)" class="attr-hint">
          {{ getSelectionHint(attr) }}
        </div> -->
        <div class="flex flex-wrap gap-2">
          <span v-for="(option, index) in (attr.options || []).filter((option): option is string => !!option)" :key="index">
            <label :for="`${option}_${index}`">
              <input
                :id="`${option}_${index}`"
                v-model="selections[attr.name || '']"
                class="hidden"
                type="radio"
                :class="className(attr.name || '')"
                :name="attr.name || ''"
                :value="option"
                :aria-disabled="!isOptionEnabled(attr.name || '', option)"
                @change="handleSelectionChange(attr.name || '')" />
              <span
                class="variant-option"
                :class="[`picker-${option}`, { 'is-disabled': !isOptionEnabled(attr.name || '', option) }]"
                :title="`${attr.label || attr.name}: ${option}`"
                >{{ option }}</span
              >
            </label>
          </span>
        </div>
      </div>

      <!-- COLOR SWATCHES -->
      <div v-else-if="attr.name == 'pa_color' || attr.name == 'color'" class="flex flex-col gap-2">
        <div class="attr-label">
          {{ $t('general.color') }}
          <span v-if="selections[attr.name || '']"
            >: <span class="attr-value">{{ getSelectedName(attr, selections[attr.name || '']) }}</span></span
          >
        </div>
        <div v-if="getSelectionHint(attr)" class="attr-hint">
          {{ getSelectionHint(attr) }}
        </div>
        <div class="flex flex-wrap gap-2.5">
          <span
            v-for="(term, termIndex) in 'terms' in attr && attr.terms?.nodes ? attr.terms.nodes.filter((term) => term?.slug) : []"
            :key="term.slug || termIndex">
            <Tooltip :text="term.name || ''">
              <label :for="`${term.slug || ''}_${termIndex}`">
                <input
                  :id="`${term.slug || ''}_${termIndex}`"
                  v-model="selections[attr.name || '']"
                  class="hidden"
                  type="radio"
                  :class="className(attr.name || '')"
                  :name="attr.name || ''"
                  :value="term.slug || ''"
                  :aria-disabled="!isOptionEnabled(attr.name || '', term.slug || '')"
                  @change="handleSelectionChange(attr.name || '')" />
                <span
                  class="variant-swatch"
                  :class="[`color-${term.slug}`, { 'is-disabled': !isOptionEnabled(attr.name || '', term.slug || '') }]"
                  :title="`${attr.label || attr.name}: ${term.name || term.slug}`"></span>
              </label>
            </Tooltip>
          </span>
        </div>
      </div>

      <!-- DROPDOWN -->
      <div v-else-if="'terms' in attr && (attr.terms?.nodes?.length || 0) > 8" class="flex flex-col gap-2">
        <div class="attr-label">
          {{ attr.label || attr.name }}
          <span v-if="selections[attr.name || '']"
            >: <span class="attr-value">{{ getSelectedName(attr, selections[attr.name || '']) }}</span></span
          >
        </div>
        <div v-if="getSelectionHint(attr)" class="attr-hint">
          {{ getSelectionHint(attr) }}
        </div>
        <select
          :id="attr.name || ''"
          v-model="selections[attr.name || '']"
          :name="attr.name || ''"
          required
          class="variant-select"
          @change="handleSelectionChange(attr.name || '')">
          <option disabled hidden>{{ $t('general.choose') }} {{ decodeURIComponent(attr.label || attr.name || '') }}</option>
          <option
            v-for="(term, dropdownIndex) in 'terms' in attr && attr.terms?.nodes ? attr.terms.nodes.filter((term) => term?.slug) : []"
            :key="term.slug || dropdownIndex"
            :value="term.slug || ''"
            :aria-disabled="!isOptionEnabled(attr.name || '', term.slug || '')"
            v-html="term.name"></option>
        </select>
      </div>

      <!-- CHECKBOXES -->
      <div v-else class="flex flex-col gap-2">
        <div class="attr-label">
          {{ attr.label || attr.name }}
          <span v-if="selections[attr.name || '']"
            >: <span class="attr-value">{{ getSelectedName(attr, selections[attr.name || '']) }}</span></span
          >
        </div>
        <div v-if="getSelectionHint(attr)" class="attr-hint">
          {{ getSelectionHint(attr) }}
        </div>
        <div class="flex flex-wrap gap-2">
          <span v-for="(term, index) in 'terms' in attr && attr.terms?.nodes ? attr.terms.nodes.filter((term) => term?.slug) : []" :key="term.slug || index">
            <label :for="`${term.slug}_${index}`">
              <input
                :id="`${term.slug}_${index}`"
                v-model="selections[attr.name || '']"
                class="hidden"
                type="radio"
                :class="className(attr.name || '')"
                :name="attr.name || ''"
                :value="term.slug || ''"
                :aria-disabled="!isOptionEnabled(attr.name || '', term.slug || '')"
                @change="handleSelectionChange(attr.name || '')" />
              <span
                class="variant-option"
                :class="[`picker-${term.slug}`, { 'is-disabled': !isOptionEnabled(attr.name || '', term.slug || '') }]"
                :title="`${attr.label || attr.name}: ${term.slug}`"
                >{{ term.name }}</span
              >
            </label>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@reference "#tailwind";

.attr-label {
  @apply font-sans text-xs uppercase tracking-wider text-[var(--color-charcoal)]/70;
}

.attr-value {
  @apply font-medium text-[var(--color-charcoal)];
}

.attr-hint {
  @apply font-sans text-[11px] normal-case tracking-normal text-[var(--color-charcoal)]/50;
}

.variant-option {
  @apply inline-flex items-center border px-3.5 py-2 font-sans text-xs font-medium tracking-wider uppercase transition-all duration-200 cursor-pointer;
  border-color: var(--color-sand);
  background-color: transparent;
  color: color-mix(in oklab, var(--color-charcoal) 80%, transparent);
}

.variant-option:hover {
  border-color: var(--color-charcoal);
}

.variant-option.is-disabled {
  @apply cursor-not-allowed opacity-40;
}

.variant-option.is-disabled:hover {
  border-color: var(--color-sand);
}

input[type='radio']:checked ~ .variant-option {
  border-color: var(--color-charcoal);
  background-color: var(--color-charcoal);
  color: var(--color-cream);
}

.variant-swatch {
  @apply inline-block cursor-pointer rounded-full border-2 transition-all duration-200;
  width: 2rem;
  height: 2rem;
  border-color: var(--color-sand);
}

.variant-swatch:hover {
  border-color: var(--color-charcoal);
}

.variant-swatch.is-disabled {
  @apply cursor-not-allowed opacity-40;
}

.variant-swatch.is-disabled:hover {
  border-color: var(--color-sand);
}

input[type='radio']:checked ~ .variant-swatch {
  border-color: var(--color-charcoal);
  box-shadow:
    0 0 0 2px var(--color-cream),
    0 0 0 3px var(--color-charcoal);
}

.color-green {
  background-color: #4a5d3a;
}

.color-blue {
  background-color: #3a4a5d;
}

.color-red {
  background-color: #8b3a2e;
}

.color-yellow {
  background-color: #b89b3a;
}

.color-orange {
  background-color: #b8703a;
}

.color-purple {
  background-color: #5d3a5d;
}

.color-black {
  background-color: var(--color-charcoal);
}

.variant-select {
  @apply w-full appearance-none py-2.5 px-4 font-sans text-sm outline-none transition-colors;
  background-color: var(--color-cream);
  border: 1px solid var(--color-sand);
  color: var(--color-charcoal);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' viewBox='0 0 16 16'%3E%3Cpath stroke='%23221e1a' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M4 6l4 4 4-4'/%3E%3C/svg%3E");
  background-position: center right 12px;
  background-repeat: no-repeat;
  background-size: 1rem;
  padding-right: 2.5rem;
}

.variant-select:focus-visible {
  border-color: var(--color-charcoal);
}
</style>
