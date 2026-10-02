import gsap from 'gsap';

const SLIDE_DURATION = 0.4;

// Vue <Transition> JS hooks for sliding between keyed siblings of differing height (tab panels,
// form steps...) without the end-of-animation height jump a flat `height:auto` release causes —
// see onEnter for why tweening TO 'auto' itself, not a measured px value, is what fixes that.
// `getDirection` is read at the moment each hook actually fires, so callers just update a plain
// variable right before the keyed child changes rather than threading direction through props.
export function useHeightAwareSlideTransition(getDirection: () => 1 | -1) {
  const onBeforeLeave = (el: Element): void => {
    const node = el as HTMLElement;
    const wrapper = node.parentElement;
    // Pin the wrapper to the leaving view's own height before it drops out of flow below —
    // otherwise the wrapper snaps straight to the entering view's height, making the leaving
    // content visibly resize mid-slide instead of just sliding away at its original size.
    if (wrapper instanceof HTMLElement) {
      wrapper.style.height = `${wrapper.getBoundingClientRect().height}px`;
    }
    gsap.killTweensOf(node);
    node.style.position = 'absolute';
    node.style.inset = '0';
  };

  const onLeave = (el: Element, done: () => void): void => {
    if (prefersReducedMotion()) {
      done();
      return;
    }
    gsap.to(el, {
      xPercent: getDirection() * -100,
      duration: SLIDE_DURATION,
      ease: 'power2.inOut',
      onComplete: done,
    });
  };

  const onEnter = (el: Element, done: () => void): void => {
    const node = el as HTMLElement;
    const wrapper = node.parentElement;

    // Grow or shrink the pinned wrapper to the entering view's own height over the same beat as
    // the slide, instead of releasing it to `auto` only once the leaving view is gone (which
    // snapped the wrapper straight to the new height right as the slide finished).
    if (wrapper instanceof HTMLElement) {
      gsap.killTweensOf(wrapper);
      if (prefersReducedMotion()) {
        wrapper.style.height = '';
      } else {
        // 'auto' lets GSAP measure the true natural height itself right as the tween starts,
        // rather than trusting a snapshot taken slightly earlier that can drift from the real
        // value by the time the content has fully settled.
        gsap.to(wrapper, {
          height: 'auto',
          duration: SLIDE_DURATION,
          ease: 'power2.inOut',
          onComplete: () => {
            wrapper.style.height = '';
          },
        });
      }
    }

    if (prefersReducedMotion()) {
      done();
      return;
    }
    gsap.killTweensOf(node);
    gsap.fromTo(node, { xPercent: getDirection() * 100 }, { xPercent: 0, duration: SLIDE_DURATION, ease: 'power2.inOut', onComplete: done });
  };

  return { onBeforeLeave, onLeave, onEnter };
}
