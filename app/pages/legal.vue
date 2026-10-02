<script setup lang="ts">
const route = useRoute();
const { t } = useI18n();

const TABS = [
  { slug: 'cookies', labelKey: 'legal.tabs.cookies' },
  { slug: 'terminos', labelKey: 'legal.tabs.terms' },
  { slug: 'privacidad', labelKey: 'legal.tabs.privacy' },
  { slug: 'aviso-legal', labelKey: 'legal.tabs.notice' },
] as const;

const indexOfTab = (slug: string) => TABS.findIndex((tab) => tab.slug === slug);

const activeTab = computed(() => {
  const requested = route.query.tab;
  return TABS.some((tab) => tab.slug === requested) ? (requested as string) : TABS[0].slug;
});

const activeTabLabel = computed(() => t(TABS[indexOfTab(activeTab.value)]?.labelKey ?? TABS[0].labelKey));

useSeoMeta({
  title: () => activeTabLabel.value,
});

// The tabs' labels vary in width, so (unlike a fixed two-tab toggle) the active-tab underline's
// position and width need to be measured from the real DOM rather than expressed as a CSS
// percentage — null until the first measurement lands so it never flashes in at (0, 0).
// NuxtLink is a component, so its template ref is the component instance, not the <a> itself —
// `.$el` is what actually has layout to measure.
const tabRefs = ref<{ $el: HTMLElement }[]>([]);
const indicatorStyle = ref<{ left: string; width: string } | null>(null);

const updateIndicator = () => {
  const el = tabRefs.value[indexOfTab(activeTab.value)]?.$el as HTMLElement | undefined;
  if (!el) return;
  indicatorStyle.value = { left: `${el.offsetLeft}px`, width: `${el.offsetWidth}px` };
};

// A resize fires far more often than the layout actually needs re-measuring — coalesce to at
// most once per frame instead of recomputing (and reflowing) on every single event.
let resizeFrame: number | null = null;
const onResize = () => {
  if (resizeFrame != null) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    updateIndicator();
  });
};

onMounted(() => {
  updateIndicator();
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  if (resizeFrame != null) cancelAnimationFrame(resizeFrame);
});

// Read by onContentEnter/onContentLeave at the moment they actually fire — the tabs sit in a
// fixed left-to-right order, so moving to a tab further right slides the same direction a forward
// step through that row would, and back otherwise.
let slideDirection: 1 | -1 = 1;
watch(activeTab, (newSlug, oldSlug) => {
  slideDirection = indexOfTab(newSlug) >= indexOfTab(oldSlug) ? 1 : -1;
  nextTick(updateIndicator);
});
const { onBeforeLeave: onContentBeforeLeave, onLeave: onContentLeave, onEnter: onContentEnter } = useHeightAwareSlideTransition(() => slideDirection);
</script>

<template>
  <main class="container my-16 max-w-4xl">
    <h1 class="legal-heading mb-8">{{ $t('legal.pageTitle') }}</h1>

    <nav class="legal-tabs" :aria-label="$t('legal.tabsAriaLabel')">
      <NuxtLink
        v-for="tab in TABS"
        ref="tabRefs"
        :key="tab.slug"
        :to="`/legal?tab=${tab.slug}`"
        class="legal-tab"
        :class="{ 'is-active': activeTab === tab.slug }">
        {{ $t(tab.labelKey) }}
      </NuxtLink>
      <div v-if="indicatorStyle" class="tab-indicator" :style="indicatorStyle"></div>
    </nav>

    <div class="legal-prose relative overflow-hidden">
      <Transition :css="false" @before-leave="onContentBeforeLeave" @leave="onContentLeave" @enter="onContentEnter">
        <!-- Política de Cookies -->
        <div v-if="activeTab === 'cookies'" key="cookies">
          <p v-html="$t('legal.cookies.intro')"></p>

          <h2>{{ $t('legal.cookies.whatTitle') }}</h2>
          <p>{{ $t('legal.cookies.whatText') }}</p>

          <h2>{{ $t('legal.cookies.typesTitle') }}</h2>
          <ul>
            <li v-html="$t('legal.cookies.typesTechnical')"></li>
            <li v-html="$t('legal.cookies.typesAnalytics')"></li>
          </ul>

          <h2>{{ $t('legal.cookies.managementTitle') }}</h2>
          <p>{{ $t('legal.cookies.managementIntro') }}</p>
          <ul>
            <li><a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer">{{ $t('legal.cookies.chromeLink') }}</a></li>
            <li>
              <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer"
                >{{ $t('legal.cookies.firefoxLink') }}</a
              >
            </li>
            <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">{{ $t('legal.cookies.safariLink') }}</a></li>
          </ul>
          <p>{{ $t('legal.cookies.managementNote') }}</p>
        </div>

        <!-- Términos del Servicio -->
        <div v-else-if="activeTab === 'terminos'" key="terminos">
          <p v-html="$t('legal.terms.intro')"></p>

          <h2>{{ $t('legal.terms.purchaseTitle') }}</h2>
          <ul>
            <li v-html="$t('legal.terms.purchaseItem1')"></li>
            <li v-html="$t('legal.terms.purchaseItem2')"></li>
            <li v-html="$t('legal.terms.purchaseItem3')"></li>
          </ul>

          <h2>{{ $t('legal.terms.pricingTitle') }}</h2>
          <p>{{ $t('legal.terms.pricingText') }}</p>

          <h2>{{ $t('legal.terms.returnsTitle') }}</h2>
          <ul>
            <li>{{ $t('legal.terms.returnsItem1') }}</li>
            <li>{{ $t('legal.terms.returnsItem2') }}</li>
            <li>{{ $t('legal.terms.returnsItem3') }}</li>
          </ul>
        </div>

        <!-- Política de Privacidad -->
        <div v-else-if="activeTab === 'privacidad'" key="privacidad">
          <i18n-t keypath="legal.privacy.intro" tag="p">
            <template #brand><strong>MenudaTela</strong></template>
          </i18n-t>

          <h2>{{ $t('legal.privacy.controllerTitle') }}</h2>
          <ul>
            <li v-html="$t('legal.privacy.controllerOwner')"></li>
            <li v-html="$t('legal.privacy.controllerEmail')"></li>
          </ul>

          <h2>{{ $t('legal.privacy.dataTitle') }}</h2>
          <p>{{ $t('legal.privacy.dataIntro') }}</p>
          <ul>
            <li v-html="$t('legal.privacy.dataAccount')"></li>
            <li v-html="$t('legal.privacy.dataOrder')"></li>
            <li v-html="$t('legal.privacy.dataManagement')"></li>
          </ul>

          <h2>{{ $t('legal.privacy.legitimationTitle') }}</h2>
          <p>{{ $t('legal.privacy.legitimationText') }}</p>

          <h2>{{ $t('legal.privacy.retentionTitle') }}</h2>
          <p>{{ $t('legal.privacy.retentionText') }}</p>

          <h2>{{ $t('legal.privacy.rightsTitle') }}</h2>
          <p>{{ $t('legal.privacy.rightsText') }}</p>
        </div>

        <!-- Aviso Legal -->
        <div v-else-if="activeTab === 'aviso-legal'" key="aviso-legal">
          <p>{{ $t('legal.notice.intro') }}</p>
          <ul>
            <li v-html="$t('legal.notice.owner')"></li>
            <li v-html="$t('legal.notice.activity')"></li>
            <li v-html="$t('legal.notice.email')"></li>
            <li v-html="$t('legal.notice.website')"></li>
          </ul>

          <h2>{{ $t('legal.notice.purposeTitle') }}</h2>
          <p v-html="$t('legal.notice.purposeText')"></p>

          <h2>{{ $t('legal.notice.ipTitle') }}</h2>
          <p>{{ $t('legal.notice.ipText') }}</p>

          <h2>{{ $t('legal.notice.usageTitle') }}</h2>
          <p v-html="$t('legal.notice.usageText')"></p>

          <h2>{{ $t('legal.notice.liabilityTitle') }}</h2>
          <p>{{ $t('legal.notice.liabilityText') }}</p>
        </div>
      </Transition>
    </div>
  </main>
</template>

<style scoped>
.legal-heading {
  font-family: var(--font-serif);
  font-size: 1.75rem;
  font-weight: 500;
  color: var(--color-charcoal);
}

.legal-tabs {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.75rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--color-sand);
}

.tab-indicator {
  position: absolute;
  bottom: -1px;
  height: 2px;
  background-color: var(--color-charcoal);
  transition:
    left 0.3s ease,
    width 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .tab-indicator {
    transition-duration: 0s;
  }
}

.legal-tab {
  padding: 0.75rem 0;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: color-mix(in oklab, var(--color-charcoal) 55%, transparent);
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.2s ease;
}

.legal-tab:hover {
  color: var(--color-charcoal);
}

.legal-tab.is-active {
  color: var(--color-charcoal);
}

.legal-prose h2 {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--color-charcoal);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}

.legal-prose h2:first-child {
  margin-top: 0;
}

.legal-prose p {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
  margin-bottom: 1rem;
}

.legal-prose ul {
  list-style: disc;
  padding-left: 1.25rem;
  margin-bottom: 1rem;
}

.legal-prose li {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
  margin-bottom: 0.5rem;
}

.legal-prose strong {
  color: var(--color-charcoal);
  font-weight: 600;
}

.legal-prose a {
  color: var(--color-charcoal);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.legal-prose code {
  padding: 0.125rem 0.375rem;
  font-size: 0.875em;
  background-color: var(--color-sand);
  color: var(--color-charcoal);
}
</style>
