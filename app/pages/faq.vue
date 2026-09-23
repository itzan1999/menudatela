<script setup lang="ts">
const FAQS = [
  {
    question: '¿Necesito crear una cuenta para comprar?',
    answer: 'Sí, es necesario registrarte con tu correo electrónico para poder realizar un pedido. Al crear tu cuenta recibirás un correo de confirmación y podrás consultar el estado de tus compras desde tu área de cliente.',
  },
  {
    question: '¿Qué métodos de pago aceptáis?',
    answer: 'Procesamos todos los pagos de forma segura a través de Stripe, que admite las principales tarjetas de crédito y débito. No almacenamos los datos completos de tu tarjeta en ningún momento.',
  },
  {
    question: '¿Cuándo se confirma mi pedido?',
    answer: 'Tras el pago recibirás un correo con el resumen de tu compra. Debido a nuestro proceso de gestión de stock, cada pedido se revisa y confirma manualmente por nuestro equipo antes de prepararlo para el envío; te avisaremos si hay cualquier cambio.',
  },
  {
    question: '¿Cuánto tarda en llegar mi pedido?',
    answer: 'Preparamos los pedidos en 24-48h laborables tras su confirmación. El tiempo de entrega habitual es de 2 a 5 días desde el envío, dependiendo del destino.',
  },
  {
    question: '¿Puedo devolver un pedido?',
    answer: 'Sí, dispones de 30 días desde la entrega para solicitar una devolución. Puedes gestionarla desde tu área de cliente en la página de Envíos y Devoluciones. Consulta también nuestra política de devoluciones en la sección legal.',
  },
  {
    question: '¿Cómo puedo saber si una tela es adecuada para mi proyecto?',
    answer: 'En la ficha de cada producto encontrarás su composición, gramaje y recomendaciones de uso. Si tienes dudas sobre una tela en concreto, escríbenos y te ayudaremos a elegir la más adecuada.',
  },
  {
    question: '¿Cómo puedo contactar con vosotros?',
    answer: 'Puedes escribirnos en cualquier momento a través de nuestra página de contacto y te responderemos por correo electrónico lo antes posible.',
  },
];

const openIndex = ref<number | null>(null);

const toggle = (index: number) => {
  openIndex.value = openIndex.value === index ? null : index;
};

useSeoMeta({
  title: 'Preguntas Frecuentes',
});
</script>

<template>
  <main class="container my-16 max-w-3xl">
    <h1 class="heading-serif-lg mb-8">Preguntas Frecuentes</h1>

    <div class="faq-list">
      <div v-for="(faq, index) in FAQS" :key="faq.question" class="faq-item">
        <button type="button" class="faq-question" :aria-expanded="openIndex === index" @click="toggle(index)">
          <span>{{ faq.question }}</span>
          <Icon :name="openIndex === index ? 'ion:remove-outline' : 'ion:add-outline'" size="18" />
        </button>
        <div v-if="openIndex === index" class="faq-answer">
          <p>{{ faq.answer }}</p>
        </div>
      </div>
    </div>

    <p class="faq-footer">
      ¿No has encontrado lo que buscabas? Escríbenos a nuestro correo de contacto <a href="mailto:dev@c3i.es">dev@c3i.es</a>.
    </p>
  </main>
</template>

<style scoped>
.faq-list {
  border-top: 1px solid var(--color-sand);
}

.faq-item {
  border-bottom: 1px solid var(--color-sand);
}

.faq-question {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 1.25rem 0;
  text-align: left;
  font-size: 0.9375rem;
  font-weight: 500;
  color: var(--color-charcoal);
  background-color: transparent;
  cursor: pointer;
}

.faq-question :deep(svg) {
  flex-shrink: 0;
  color: var(--color-charcoal);
}

.faq-answer {
  padding: 0 1.5rem 1.25rem 0;
}

.faq-answer p {
  font-size: 0.9375rem;
  line-height: 1.65;
  color: color-mix(in oklab, var(--color-charcoal) 75%, transparent);
}

.faq-footer {
  margin-top: 2.5rem;
  font-size: 0.9375rem;
  color: color-mix(in oklab, var(--color-charcoal) 70%, transparent);
}

.faq-footer a {
  color: var(--color-charcoal);
  text-decoration: underline;
  text-underline-offset: 2px;
}
</style>
