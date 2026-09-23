import { createResolver } from '@nuxt/kit';

const { resolve } = createResolver(import.meta.url);

export default defineNuxtConfig({
  // Get all the pages, components, composables and plugins from the parent theme
  extends: ['./woonuxt_base'],

  css: ['~/assets/css/custom.css'],

  components: [{ path: './components', pathPrefix: false }],

  alias: {
    // Must resolve to an absolute path, or Vite treats each relative resolution
    // as a distinct module and warns about duplicated modules for the same path.
    '#tailwind': resolve('./woonuxt_base/app/assets/css/main.css'),
  },

  hooks: {
    // woonuxt_base registers the order-received/order-summary routes itself via a
    // pages:extend hook pinned to its own directory, bypassing the normal app/
    // override-by-path resolution. Repoint them here so a same-named file in this
    // layer's app/pages is used instead, without touching woonuxt_base's page.
    'pages:extend'(pages) {
      const overridePath = resolve('./app/pages/order-summary.vue');
      for (const page of pages) {
        if (page.name === 'order-received' || page.name === 'order-summary') {
          page.file = overridePath;
        }
      }
    },
  },

  /**
   * Depending on your servers capabilities, you may need to adjust the following settings.
   * It will affect the build time but also increase the reliability of the build process.
   * If you have a server with a lot of memory and CPU, you can remove the following settings.
   * @property {number} concurrency - How many pages to prerender at once
   * @property {number} interval - How long to wait between prerendering pages
   * @property {boolean} failOnError - This stops the build from failing but the page will not be statically generated
   */
  nitro: {
    prerender: {
      concurrency: 10,
      interval: 1000,
      failOnError: false,
    },
  },
});
