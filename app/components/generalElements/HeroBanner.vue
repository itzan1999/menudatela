<script setup lang="ts">
import gsap from 'gsap';

const rootEl = ref<HTMLElement | null>(null);
const panelEl = ref<HTMLElement | null>(null);
const seamEl = ref<HTMLElement | null>(null);
const mediaEl = ref<HTMLElement | null>(null);

let ctx: gsap.Context | undefined;
let headerObserver: ResizeObserver | undefined;

// The header is sticky, not fixed, so the hero has to know its real rendered height (it varies
// slightly between mobile/desktop and isn't worth hardcoding) to fill exactly "the rest of the
// screen" below it rather than guessing a pixel value that drifts once the header changes.
const observeHeaderHeight = () => {
  const header = document.querySelector('header');
  if (!header || !rootEl.value) return;

  const applyHeight = () => {
    rootEl.value?.style.setProperty('--header-h', `${header.getBoundingClientRect().height}px`);
  };

  applyHeight();
  headerObserver = new ResizeObserver(applyHeight);
  headerObserver.observe(header);
};

onMounted(() => {
  observeHeaderHeight();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !panelEl.value || !seamEl.value || !mediaEl.value) return;

  const contentEls = panelEl.value.querySelectorAll('.hero-title, .hero-subtitle, .hero-cta');

  try {
    ctx = gsap.context(() => {
      // The seam "stitches itself" shut first, then the fabric unfurls out from behind it —
      // one orchestrated beat instead of separate per-element fades.
      gsap.set(seamEl.value, { scaleX: 0, scaleY: 0, transformOrigin: 'top left' });
      gsap.set(mediaEl.value, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(contentEls, { opacity: 0, y: 10 });

      gsap
        .timeline({ defaults: { ease: 'power2.out' } })
        .to(seamEl.value, { scaleX: 1, scaleY: 1, duration: 0.55 })
        .to(mediaEl.value, { clipPath: 'inset(0 0% 0 0)', duration: 0.85, ease: 'power3.inOut' }, '-=0.1')
        .to(contentEls, { opacity: 1, y: 0, duration: 0.5 }, '<');
    });
  } catch {
    gsap.set([seamEl.value, mediaEl.value, contentEls], { clearProps: 'all' });
  }
});

onUnmounted(() => {
  ctx?.revert();
  headerObserver?.disconnect();
});
</script>

<template>
  <div ref="rootEl" class="hero-split">
    <div ref="panelEl" class="hero-panel">
      <h1 class="hero-title">{{ $t('home.heroTitle') }}</h1>
      <p class="hero-subtitle">{{ $t('home.heroSubtitle') }}</p>
      <NuxtLink class="hero-cta" to="/products">{{ $t('home.viewCollection') }}</NuxtLink>
    </div>

    <div ref="seamEl" class="hero-seam" aria-hidden="true"></div>

    <div ref="mediaEl" class="hero-media">
      <NuxtPicture
        width="1400"
        height="1200"
        src="/images/hero-totem-teja.jpg"
        :alt="$t('home.heroImageAlt')"
        loading="eager"
        sizes="sm:100vw md:100vw lg:62vw"
        :preload="{ fetchPriority: 'high' }"
        :img-attrs="{ class: 'hero-image' }" />
    </div>
  </div>
</template>

<style scoped>
.hero-split {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  /* The panel and seam take exactly the room their content needs (text must never clip); the
     photo is the only flexible row, absorbing whatever's left of the fixed total height. */
  grid-template-rows: minmax(0, 1fr) auto auto;
  /* Fills the screen below the (sticky, not fixed) header rather than a fixed px height, so it
     adapts to both the viewport and whatever the header's real rendered height turns out to be
     — set from JS once mounted, since that's the only reliable source for the latter.
     100dvh (where supported) accounts for mobile browser chrome; the 100vh line above it is a
     fallback for browsers that don't parse dvh at all. */
  height: calc(100vh - var(--header-h, 86px));
  height: calc(100dvh - var(--header-h, 86px));
  min-height: 30rem;
  background-color: var(--color-cream);
}

@media (min-width: 900px) {
  .hero-split {
    /* Panel | seam | photo as three explicit columns, rather than relying on `order` for a
       third grid item — auto-placement with `order` gets ambiguous past two items. */
    grid-template-columns: minmax(320px, 38%) 2px 1fr;
    grid-template-rows: 1fr;
  }
}

.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  order: 3;
  padding: 2.5rem 1rem 3rem;
}

@media (min-width: 900px) {
  .hero-panel {
    grid-column: 1;
    order: initial;
    padding: 3rem 2.5rem 3rem 3rem;
  }
}

@media (min-width: 1400px) {
  .hero-panel {
    padding-left: max(3rem, calc((100vw - 90rem) / 2 + 3rem));
  }
}

/* The stitched seam between panel and photo. A dedicated element (rather than a border on
   .hero-panel) so it can be scaled independently for the GSAP "stitching in" reveal. */
.hero-seam {
  order: 2;
  width: 100%;
  height: 2px;
  border-top: 2px dashed color-mix(in oklab, var(--color-charcoal) 35%, transparent);
}

@media (min-width: 900px) {
  .hero-seam {
    grid-column: 2;
    order: initial;
    width: 2px;
    height: 100%;
    border-top: none;
    border-right: 2px dashed color-mix(in oklab, var(--color-charcoal) 35%, transparent);
  }
}

.hero-title {
  font-family: var(--font-serif);
  font-size: 1.875rem;
  font-weight: 500;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--color-charcoal);
  max-width: 22rem;
}

@media (min-width: 900px) {
  .hero-title {
    font-size: 2.375rem;
  }
}

.hero-subtitle {
  max-width: 24rem;
  margin-top: 1rem;
  font-size: 0.9375rem;
  line-height: 1.65;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
}

.hero-cta {
  display: inline-block;
  align-self: flex-start;
  margin-top: 1.75rem;
  padding-bottom: 0.3125rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--color-charcoal);
  border-bottom: 1px solid color-mix(in oklab, var(--color-charcoal) 45%, transparent);
  transition: border-color 0.2s ease;
}

.hero-cta:hover {
  border-color: var(--color-terracotta);
  color: var(--color-terracotta);
}

.hero-media {
  order: 1;
  min-height: 11rem;
  overflow: hidden;
}

@media (min-width: 900px) {
  .hero-media {
    grid-column: 3;
    order: initial;
    min-height: 0;
  }
}

.hero-media :deep(.hero-image) {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
