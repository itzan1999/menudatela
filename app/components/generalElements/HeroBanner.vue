<template>
  <div class="relative mx-auto">
    <NuxtPicture
      width="1400"
      height="800"
      src="https://wordpress-dev-a546.up.railway.app/wp-content/uploads/2026/09/Totem_teja_detalle-1000x999-1.jpg"
      alt="Telas MenudaTela"
      loading="eager"
      sizes="sm:100vw md:100vw lg:100vw xl:100vw 2xl:1400px"
      :preload="{ fetchPriority: 'high' }"
      :img-attrs="{ class: 'object-cover w-full h-[480px] lg:h-[620px]' }" />
    <div class="hero-overlay"></div>
    <div class="container absolute inset-0 flex flex-col items-start justify-center">
      <p class="hero-eyebrow">Colección otoño</p>
      <h1 class="hero-title">Telas con carácter</h1>
      <p class="hero-subtitle">Tejidos seleccionados uno a uno para dar vida a tus proyectos. Algodón, lino y texturas naturales.</p>
      <NuxtLink class="hero-cta" to="/products">
        <span>Ver colección</span>
        <Icon name="ion:arrow-forward-outline" size="16" />
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to right,
    color-mix(in oklab, var(--color-charcoal) 78%, transparent) 0%,
    color-mix(in oklab, var(--color-charcoal) 60%, transparent) 45%,
    color-mix(in oklab, var(--color-charcoal) 20%, transparent) 75%,
    transparent 100%
  );
}

.hero-eyebrow {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-cream);
  opacity: 0.9;
  margin-bottom: 0.75rem;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
}

.hero-title {
  font-family: var(--font-serif);
  font-size: 2.5rem;
  font-weight: 500;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--color-cream);
  margin-bottom: 1rem;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
}

@media (min-width: 1024px) {
  .hero-title {
    font-size: 4rem;
  }
}

.hero-subtitle {
  max-width: 28rem;
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.6;
  color: var(--color-cream);
  opacity: 0.95;
  margin-bottom: 2rem;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
}

.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding-bottom: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-cream);
  border-bottom: 1px solid color-mix(in oklab, var(--color-cream) 60%, transparent);
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
  transition:
    border-color 0.2s ease,
    gap 0.2s ease;
}

.hero-cta:hover {
  border-color: var(--color-cream);
  gap: 0.75rem;
}
</style>
