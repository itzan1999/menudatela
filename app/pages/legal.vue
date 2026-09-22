<script setup lang="ts">
const route = useRoute();

const TABS = [
  { slug: 'cookies', label: 'Política de Cookies' },
  { slug: 'terminos', label: 'Términos del Servicio' },
  { slug: 'privacidad', label: 'Política de Privacidad' },
  { slug: 'aviso-legal', label: 'Aviso Legal' },
] as const;

const activeTab = computed(() => {
  const requested = route.query.tab;
  return TABS.some((tab) => tab.slug === requested) ? (requested as string) : TABS[0].slug;
});

const activeTabLabel = computed(() => TABS.find((tab) => tab.slug === activeTab.value)?.label ?? '');

useSeoMeta({
  title: () => activeTabLabel.value,
});
</script>

<template>
  <main class="container my-16 max-w-4xl">
    <h1 class="legal-heading mb-8">Información Legal</h1>

    <nav class="legal-tabs" aria-label="Páginas legales">
      <NuxtLink
        v-for="tab in TABS"
        :key="tab.slug"
        :to="`/legal?tab=${tab.slug}`"
        class="legal-tab"
        :class="{ 'is-active': activeTab === tab.slug }">
        {{ tab.label }}
      </NuxtLink>
    </nav>

    <div class="legal-prose">
      <!-- Política de Cookies -->
      <template v-if="activeTab === 'cookies'">
        <p>
          En <strong>MenudaTela</strong> utilizamos cookies y tecnologías similares para facilitar la navegación por nuestra web (conectada mediante
          WooCommerce y Nuxt) y mejorar la experiencia de usuario.
        </p>

        <h2>1. ¿Qué son las Cookies?</h2>
        <p>
          Una cookie es un pequeño archivo de texto que se almacena en tu navegador cuando visitas casi cualquier página web. Su utilidad es que la web sea
          capaz de recordar tu visita cuando vuelvas a navegar por ella.
        </p>

        <h2>2. Tipos de Cookies que utilizamos</h2>
        <ul>
          <li>
            <strong>Cookies Técnicas y de Sesión:</strong> Son estrictamente necesarias para el correcto funcionamiento de la web, permitiendo mantener la
            sesión del usuario una vez que ha iniciado sesión en su cuenta y gestionar el carrito de la compra.
          </li>
          <li>
            <strong>Cookies de Análisis / Terceros:</strong> Nos ayudan a medir y analizar el tráfico de la web para mejorar nuestros servicios y la oferta
            de telas.
          </li>
        </ul>

        <h2>3. Gestión y Configuración de Cookies</h2>
        <p>Puedes permitir, bloquear o eliminar las cookies instaladas en tu equipo mediante la configuración de las opciones del navegador instalado en tu dispositivo:</p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647?hl=es" target="_blank" rel="noopener noreferrer">Configuración para Google Chrome</a></li>
          <li>
            <a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web" target="_blank" rel="noopener noreferrer"
              >Configuración para Mozilla Firefox</a
            >
          </li>
          <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Configuración para Safari</a></li>
        </ul>
        <p>
          Si desactivas las cookies técnicas, es posible que algunas funcionalidades de la tienda (como el inicio de sesión o el proceso de compra con
          WooCommerce) no funcionen correctamente.
        </p>
      </template>

      <!-- Términos del Servicio -->
      <template v-else-if="activeTab === 'terminos'">
        <p>
          Las presentes condiciones generales regulan el uso del servicio de venta online de telas en <strong>MenudaTela</strong>. Al registrarte y realizar
          un pedido, aceptas expresamente estas condiciones.
        </p>

        <h2>1. Proceso de Compra y Cuenta de Usuario</h2>
        <ul>
          <li>Para realizar un pedido en MenudaTela, es <strong>obligatorio crear una cuenta de usuario</strong>. Tras el registro, recibirás un correo electrónico de confirmación.</li>
          <li>
            Al finalizar tu compra, procesaremos el pago de forma segura a través de <strong>Stripe</strong> y te enviaremos un correo electrónico con el
            resumen detallado del pedido.
          </li>
          <li>
            <strong>Confirmación manual:</strong> Debido a nuestro proceso de gestión y control de stock, los pedidos <strong>deben ser confirmados
            manualmente</strong> en nuestro sistema interno (WordPress) por nuestro equipo antes de proceder a su preparación y envío definitivo. Te
            notificaremos cualquier cambio de estado.
          </li>
        </ul>

        <h2>2. Precios y Envíos</h2>
        <p>
          Todos los precios indicados en la web incluyen el Impuesto sobre el Valor Añadido (IVA) aplicable en España. Los gastos de envío se especificarán
          de forma clara durante el proceso de pago antes de confirmar la compra.
        </p>

        <h2>3. Política de Devoluciones y Reembolsos</h2>
        <ul>
          <li>Tienes derecho a solicitar la devolución de un pedido dentro del plazo legal establecido (14 días naturales desde la recepción).</li>
          <li>
            Para iniciar una devolución, debes ponerte en contacto con nosotros o solicitarlo desde tu área de cliente. Esta acción generará una nota interna
            en nuestro sistema de administración de WordPress para informar de que se debe realizar el reembolso correspondiente.
          </li>
          <li>
            Una vez comprobado el estado de la tela y el cumplimiento de las condiciones de devolución, procederemos a efectuar el reembolso mediante el
            método de pago original o el canal acordado.
          </li>
        </ul>
      </template>

      <!-- Política de Privacidad -->
      <template v-else-if="activeTab === 'privacidad'">
        <p>
          En <strong>MenudaTela</strong> nos tomamos muy en serio la privacidad de tus datos personales. De conformidad con el Reglamento General de
          Protección de Datos (RGPD UE 2016/679) y la Ley Orgánica 3/2018 (LOPDGDD), te informamos sobre cómo tratamos tus datos.
        </p>

        <h2>1. Responsable del Tratamiento</h2>
        <ul>
          <li><strong>Titular:</strong> MenudaTela</li>
          <li><strong>Correo de contacto:</strong> privacidad@menudatela.com</li>
        </ul>

        <h2>2. ¿Qué datos recopilamos y con qué finalidad?</h2>
        <p>
          Para poder ofrecerte nuestros servicios de venta online a través de nuestra plataforma (desarrollada con WooCommerce y frontend en Nuxt),
          recopilamos los siguientes datos:
        </p>
        <ul>
          <li><strong>Datos de registro y cuenta de usuario:</strong> Nombre, apellidos, correo electrónico y contraseña. Es obligatorio crear una cuenta para realizar pedidos (enviando correos de confirmación de registro).</li>
          <li>
            <strong>Datos de compra y envío:</strong> Dirección postal, teléfono y detalles de pago (procesados de forma segura a través de
            <strong>Stripe</strong>; MenudaTela no almacena los datos completos de tus tarjetas bancarias).
          </li>
          <li>
            <strong>Gestión de pedidos y devoluciones:</strong> Información sobre las compras realizadas, resúmenes de pedidos enviados por correo
            electrónico y notas internas generadas en nuestro sistema de gestión (WordPress) en caso de que solicites una devolución para la tramitación de
            tu reembolso.
          </li>
        </ul>

        <h2>3. Legitimación para el tratamiento de datos</h2>
        <p>
          La base legal para el tratamiento de tus datos es la ejecución del contrato de compraventa y la prestación de los servicios solicitados al crear
          tu cuenta de usuario y realizar pedidos.
        </p>

        <h2>4. Conservación de los datos</h2>
        <p>
          Los datos personales se conservarán mientras se mantenga la relación comercial o de usuario y, posteriormente, durante los plazos legalmente
          exigidos para atender posibles responsabilidades fiscales o legales.
        </p>

        <h2>5. Tus Derechos</h2>
        <p>
          Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición enviando un correo
          electrónico a privacidad@menudatela.com.
        </p>
      </template>

      <!-- Aviso Legal -->
      <template v-else-if="activeTab === 'aviso-legal'">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico
          (LSSI-CE), a continuación se exponen los datos identificativos de la titularidad de este sitio web:
        </p>
        <ul>
          <li><strong>Titular:</strong> MenudaTela (en adelante, "la tienda" o "el sitio web").</li>
          <li><strong>Actividad:</strong> Venta online de telas y productos textiles.</li>
          <li><strong>Correo electrónico de contacto:</strong> contacto@menudatela.com</li>
          <li><strong>Sitio Web:</strong> https://menudatela.com</li>
        </ul>

        <h2>1. Objeto</h2>
        <p>
          El presente aviso legal regula el uso del sitio web <code>https://menudatela.com</code>, que pone a disposición de los usuarios interesados en la
          adquisición de nuestros productos textiles.
        </p>

        <h2>2. Propiedad Intelectual e Industrial</h2>
        <p>
          Todos los contenidos del sitio web (textos, fotografías, gráficos, imágenes, tecnología, software, enlaces, diseño gráfico y código fuente, entre
          otros) son propiedad exclusiva de MenudaTela o de terceros, sin que puedan entenderse cedidos al usuario ningún derecho de explotación sobre los
          mismos más allá de lo estrictamente necesario para el correcto uso de la web.
        </p>

        <h2>3. Condiciones de Uso</h2>
        <p>
          El acceso y uso de este sitio web atribuye la condición de <strong>Usuario</strong>, el cual acepta, desde dicho acceso y uso, las condiciones
          aquí reflejadas. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios que MenudaTela ofrece a través de su portal.
        </p>

        <h2>4. Exclusión de Garantías y Responsabilidad</h2>
        <p>
          MenudaTela no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo:
          errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los
          contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.
        </p>
      </template>
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
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.75rem;
  margin-bottom: 2.5rem;
  border-bottom: 1px solid var(--color-sand);
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
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.legal-tab:hover {
  color: var(--color-charcoal);
}

.legal-tab.is-active {
  color: var(--color-charcoal);
  border-bottom-color: var(--color-charcoal);
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
