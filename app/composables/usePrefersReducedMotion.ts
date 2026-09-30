// Shared by anything gating a GSAP animation behind the user's OS-level motion preference
// (the hero entrance, the product image zoom transition) — kept in one place instead of
// re-inlining the same matchMedia check at every call site.
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
