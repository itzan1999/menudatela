<script setup lang="ts">
useSeoMeta({
  title: 'Acerca de',
});
</script>

<template>
  <main class="container my-16 max-w-3xl">
    <h1 class="heading-serif-lg mb-8">Acerca de MenudaTela</h1>

    <div class="about-prose">
      <p>
        <strong>MenudaTela</strong> es una tienda online especializada en la venta de telas y productos textiles. Nuestro objetivo es acercarte una selección
        cuidada de tejidos, pensada tanto para quienes cosen como afición como para quienes lo hacen de forma profesional.
      </p>

      <p>
        Creemos en un catálogo claro y bien organizado, con información honesta sobre cada tela para que puedas elegir con confianza sin necesidad de verla
        en persona. Detrás de cada pedido hay un proceso cuidado: preparamos y confirmamos cada envío de forma manual para asegurarnos de que todo llega en
        las condiciones esperadas.
      </p>

      <p>
        Si tienes cualquier duda sobre nuestro catálogo, un pedido o cualquier otra consulta, puedes escribirnos desde nuestra
        <NuxtLink to="/contact">página de contacto</NuxtLink>.
      </p>
    </div>
  </main>
</template>

<style scoped>
.about-prose p {
  font-size: 0.9375rem;
  line-height: 1.7;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
  margin-bottom: 1.25rem;
}

.about-prose strong {
  color: var(--color-charcoal);
  font-weight: 600;
}

.about-prose a {
  color: var(--color-charcoal);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
