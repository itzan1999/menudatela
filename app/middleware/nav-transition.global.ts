import gsap from 'gsap';

// The primary navbar tabs, in their on-screen left-to-right order. Only used to compute a
// slide direction — everything else (legal pages, product pages, checkout, etc.) keeps the
// site's normal page transition.
const NAVBAR_ROUTES = ['/', '/products', '/categories', '/contact'];

const DEFAULT_TRANSITION = { name: 'page', mode: 'default' as const };

// Listing pages (products/categories/home) <-> a product detail page: the site's normal
// transition is a near-instant opacity blip (20ms + 200ms), tuned for a plain page swap — next to
// the product image's own multi-hundred-ms zoom-in, that made the rest of the page (title, price,
// description...) look like it just snapped into place while the image was still arriving.
// `out-in` (not simultaneous) so the old content is fully gone before the new content starts
// fading in, matching the same reasoning as the navbar SLIDE_TRANSITION below.
const SOFT_FADE_TRANSITION = { name: 'fade-soft', mode: 'out-in' as const };
const isProductRoute = (path: string): boolean => path.startsWith('/product/');

// Read by the hooks below at the moment they actually run, rather than being baked into a new
// transition object per navigation. Nuxt/Vue Router keep `pageTransition` on each route's own
// (persistent) meta, so the *leaving* page's transition object is whatever was last written to
// it — from when it was itself entered, one navigation ago — not the current one. A shared,
// always-fresh value sidesteps that entirely: both hooks read the same live direction, however
// stale the transition object attached to either route's meta happens to be.
let currentDirection: 1 | -1 = 1;

const SLIDE_TRANSITION = {
  css: false,
  // Nuxt pages fetch their data inside an async setup (Suspense) — with the default
  // simultaneous enter/leave, the outgoing page's exit isn't tied to the incoming page's
  // readiness at all, so a slow data fetch (e.g. a real GraphQL round trip) can leave both
  // pages' content visible/overlapping for however long that fetch takes, which reads as the
  // two pages "crossing". `out-in` waits for the leave to fully finish (and the old page to be
  // removed) before the new one is even mounted, so there's never a moment where both exist.
  mode: 'out-in' as const,
  onBeforeLeave(el: Element) {
    const node = el as HTMLElement;
    const wrapper = node.parentElement;
    // Pin the wrapper to its current rendered height before the leaving page drops out of
    // flow (below): without this, the wrapper's height — previously driven by the leaving
    // page's own content — snaps to the entering page's height immediately, so a
    // short-to-tall or tall-to-short pair makes the leaving page visibly resize mid-slide
    // instead of just sliding out at its original size.
    if (wrapper instanceof HTMLElement) {
      wrapper.style.height = `${wrapper.getBoundingClientRect().height}px`;
    }
    // A second navigation started before this element finished its own onEnter tween would
    // otherwise leave that tween fighting this one over the same transform.
    gsap.killTweensOf(node);
    node.style.position = 'absolute';
    node.style.inset = '0';
    node.style.zIndex = '1';
  },
  onLeave(el: Element, done: () => void) {
    gsap.to(el, {
      xPercent: currentDirection * -100,
      duration: 0.45,
      ease: 'power2.inOut',
      onComplete: () => {
        const wrapper = (el as HTMLElement).parentElement;
        if (wrapper instanceof HTMLElement) wrapper.style.height = '';
        done();
      },
    });
  },
  onEnter(el: Element, done: () => void) {
    gsap.killTweensOf(el);
    gsap.fromTo(el, { xPercent: currentDirection * 100 }, { xPercent: 0, duration: 0.45, ease: 'power2.inOut', onComplete: done });
  },
};

export default defineNuxtRouteMiddleware((to, from) => {
  // A purely visual, client-side concern — nothing here affects what gets rendered or navigated.
  if (import.meta.server) return;

  const fromIndex = NAVBAR_ROUTES.indexOf(from.path);
  const toIndex = NAVBAR_ROUTES.indexOf(to.path);
  const bothOnNavbar = fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex;

  if (bothOnNavbar) {
    currentDirection = toIndex > fromIndex ? 1 : -1;
    to.meta.pageTransition = SLIDE_TRANSITION;
  } else if (isProductRoute(from.path) || isProductRoute(to.path)) {
    to.meta.pageTransition = SOFT_FADE_TRANSITION;
  } else {
    to.meta.pageTransition = DEFAULT_TRANSITION;
  }
});
