import gsap from 'gsap';

// Shared-element "zoom" transition: the product image clicked on a listing card grows in place
// into the exact size/position of the main image on the product detail page. The overlay is a
// plain DOM node appended directly to <body> — deliberately outside Vue's component tree — so it
// survives the route change untouched by the page's own (unrelated) enter/leave transition, and
// isn't tied to the lifecycle of either the card or the gallery component.
type Rect = { top: number; left: number; width: number; height: number };

// overlayEl doubles as the "idle vs pending/animating" flag (null <=> idle); `animating`
// distinguishes the two non-idle states. The two always change together, so there's nothing a
// separate enum would track that these don't already.
let overlayEl: HTMLImageElement | null = null;
let animating = false;
// Bumped by every capture() call so an in-flight one (still awaiting image decode) can tell it's
// been superseded by a newer click and bail out instead of clobbering that newer one's overlay.
let generation = 0;

const cleanup = (): void => {
  overlayEl?.remove();
  overlayEl = null;
  animating = false;
};

// Two animation frames reliably land after the browser's own layout and paint have settled —
// measuring on the very next tick sometimes caught the gallery box mid-reflow.
const nextPaint = (): Promise<void> =>
  new Promise((resolvePromise) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolvePromise()));
  });

// Every top-level page in this app roots at a single <main>. Routes outside the navbar (like a
// product page) use the site's plain, *simultaneous* fade transition — the listing page you just
// clicked from doesn't leave `position:static` and stays in normal flow while it fades out, so for
// that ~200ms both pages' <main> are mounted at once, stacked one after the other. Measuring the
// new page's gallery during that overlap means measuring it pushed down by the old page's full
// height, regardless of where on that old page the click happened — waiting for the old <main> to
// actually leave the DOM (with a timeout so a slow/odd transition can't hang this forever) sidesteps
// it entirely.
const waitForSinglePage = (): Promise<void> =>
  new Promise((resolvePromise) => {
    const deadline = Date.now() + 800;
    const check = () => {
      if (document.querySelectorAll('main').length <= 1 || Date.now() > deadline) {
        resolvePromise();
        return;
      }
      requestAnimationFrame(check);
    };
    check();
  });

// Both the card and the gallery show photos with `object-fit: contain` inside a fixed (square)
// box, so a photo that isn't itself square sits inset with empty "mat" on two sides. Animating to
// the *box*'s rect grows the overlay past the real edges of the photo, ending up visibly bigger
// than the picture it's supposed to become. This works out the actual on-screen rect of the
// photo's own pixels, the same way the browser does for `object-fit: contain`.
const getContentRect = (img: HTMLImageElement): Rect => {
  const box = img.getBoundingClientRect();
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  if (!naturalWidth || !naturalHeight || !box.width || !box.height) {
    return { top: box.top, left: box.left, width: box.width, height: box.height };
  }

  const boxRatio = box.width / box.height;
  const imageRatio = naturalWidth / naturalHeight;

  let width = box.width;
  let height = box.height;
  if (imageRatio > boxRatio) {
    height = box.width / imageRatio;
  } else {
    width = box.height * imageRatio;
  }

  return {
    top: box.top + (box.height - height) / 2,
    left: box.left + (box.width - width) / 2,
    width,
    height,
  };
};

// Resolves once `img` has decoded and its natural size is known, so getContentRect() has real
// numbers to work with instead of falling back to the whole box — capped so a slow/broken image
// can't hang the reveal forever.
const waitForImageReady = (img: HTMLImageElement): Promise<void> => {
  if (img.complete && img.naturalWidth) return Promise.resolve();

  return new Promise((resolvePromise) => {
    const done = () => resolvePromise();
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
    setTimeout(done, 1500);
  });
};

const findImage = (el: Element): HTMLImageElement | null => (el instanceof HTMLImageElement ? el : el.querySelector('img'));

// getBoundingClientRect() and `position: fixed` are both supposed to speak the same viewport
// coordinates, but that guarantee breaks the moment some ancestor of the fixed element (here,
// <body>) establishes its own containing block — a transform, filter, or `scrollbar-gutter`
// reserving space asymmetrically are all candidates — shifting position:fixed content by a small,
// constant amount relative to plain getBoundingClientRect() measurements elsewhere on the page.
// Rather than chase which of those this theme actually triggers, measure it directly: ask a
// position:fixed probe to sit at a known point and see where it actually reports itself.
//
// The offset only changes when the viewport itself does (e.g. a scrollbar appearing/disappearing
// on resize), not between a capture() and its matching resolve() — cached at module scope so
// each transition forces this extra probe-and-reflow at most once instead of twice.
let cachedFixedOffset: { dx: number; dy: number } | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    cachedFixedOffset = null;
  });
}

const getFixedOffset = (): { dx: number; dy: number } => {
  if (!cachedFixedOffset) {
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;visibility:hidden;';
    document.body.appendChild(probe);
    const rect = probe.getBoundingClientRect();
    probe.remove();
    cachedFixedOffset = { dx: rect.left, dy: rect.top };
  }
  return cachedFixedOffset;
};

export function useProductImageTransition() {
  // Called on click, while the card's image is still on screen — captures where it is right now
  // and plants a matching floating copy on top of it, so the handoff to the new page is invisible.
  // Async: getContentRect() needs the image's decoded natural size to know where the "mat" is, and
  // guessing at a rect before that's known (falling back to the whole box) showed up as the
  // overlay briefly ballooning to the card's full box before snapping to the right size — showing
  // nothing for the small extra wait is better than showing the wrong thing. The wait is only ever
  // needed if the image hasn't already decoded, which for one already on screen and about to be
  // clicked is the exception, not the rule.
  const capture = async (imageUrl: string, sourceEl: Element | null): Promise<void> => {
    if (!sourceEl || typeof document === 'undefined' || prefersReducedMotion()) return;

    const sourceImg = findImage(sourceEl);
    if (!sourceImg) return;

    const myGeneration = ++generation;
    await waitForImageReady(sourceImg);
    // A different click superseded this one while we were waiting on this image to decode.
    if (myGeneration !== generation) return;

    const rect = getContentRect(sourceImg);
    if (!rect.width || !rect.height) return;

    cleanup();

    const offset = getFixedOffset();
    const img = document.createElement('img');
    img.src = imageUrl;
    img.style.cssText = `position:fixed;top:${rect.top - offset.dy}px;left:${rect.left - offset.dx}px;width:${rect.width}px;height:${rect.height}px;object-fit:cover;z-index:200;pointer-events:none;will-change:top,left,width,height;`;
    document.body.appendChild(img);

    overlayEl = img;
  };

  // Called once the destination page has mounted its own main image — animates the floating copy
  // from where it was captured to the real image's resting place, then resolves, *without* itself
  // removing the overlay yet. Whoever's hiding their own real image until this settles needs to
  // reveal it first and only then call clear() — otherwise there's a frame between the overlay
  // going away and the (still-`await`ing, so a whole microtask late) caller showing its own image
  // where neither is visible, which reads as a flicker. Safe to call more than once for the same
  // navigation (e.g. a second onMounted pass): only the first call while a capture is actually
  // pending does anything, so a stray extra call can never rip out an animation already under way.
  // Resolves to whether it actually ran an animation (vs. finding nothing pending).
  const resolve = async (targetEl: Element | null): Promise<boolean> => {
    // Nothing pending, or already animating a previous call (a stray extra call from e.g. a
    // second onMounted pass) — bail out without touching whatever, if anything, is under way.
    if (!overlayEl || animating) return false;
    if (!targetEl) {
      cleanup();
      return false;
    }

    const targetImg = findImage(targetEl);
    if (!targetImg) {
      cleanup();
      return false;
    }

    animating = true;
    const el = overlayEl;

    // The old page's removal (waitForSinglePage) and the new image's decode (waitForImageReady)
    // are unrelated — overlap them instead of paying for both in sequence. scrollTo still has to
    // happen right after the old page is confirmed gone (not after both settle), since that's the
    // removal that can itself shift scroll position — waiting on the image any longer than that
    // would just delay the correction the user can see.
    const imageReady = waitForImageReady(targetImg);
    await waitForSinglePage();
    // `behavior: 'instant'` is load-bearing: the site sets `scroll-behavior: smooth` globally
    // (app.vue), which the plain 2-argument scrollTo(0, 0) silently inherits — instead of jumping,
    // it *animates* the scroll over several hundred ms. Measuring mid-animation reads whatever
    // intermediate scrollY the easing happened to be at, which is exactly what was sending the
    // overlay flying to a scroll-height-sized wrong position instead of the gallery's real spot.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    await imageReady;
    await nextPaint();

    // A capture() (new click) or an explicit clear() while we were waiting takes priority — don't
    // stomp on whatever it started. (capture()/clear() always flip `animating` back to false, so
    // checking it alone is enough to detect either.)
    if (!animating) return false;

    // Re-assert right before measuring: between the reset above and here, up to ~1.5s can have
    // passed (the image-decode wait) — long enough for something else (the router's own scroll
    // restoration, scroll anchoring from other images loading in) to have scrolled the page again.
    // Measuring against a stale scroll position is what sends the overlay flying to a spot from a
    // whole page-height away instead of the gallery's actual resting place.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    const targetRect = getContentRect(targetImg);
    const offset = getFixedOffset();

    return new Promise<boolean>((resolvePromise) => {
      gsap.to(el, {
        top: targetRect.top - offset.dy,
        left: targetRect.left - offset.dx,
        width: targetRect.width,
        height: targetRect.height,
        duration: 0.55,
        ease: 'power3.inOut',
        onComplete: () => resolvePromise(true),
      });
    });
  };

  const hasPending = (): boolean => overlayEl !== null;

  return { capture, resolve, clear: cleanup, hasPending };
}
