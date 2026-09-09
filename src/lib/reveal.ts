// Scroll-reveal. Robust against fast scrolls (a fling can carry an element from
// below the viewport to above it between IntersectionObserver ticks, so the
// observer only ever reports it as "not intersecting" and it stays hidden). We
// guard against that with an immediate reveal for anything already at/above the
// fold plus a scroll/resize sweep that force-reveals anything above the viewport.
export function initReveal() {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (!els.length) return;

  const reveal = (el: Element) => el.classList.add('is-visible');

  const reducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (typeof IntersectionObserver === 'undefined' || reducedMotion) {
    els.forEach(reveal);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0, rootMargin: '0px 0px -8% 0px' }
  );

  const pending = new Set<HTMLElement>();
  els.forEach((el) => {
    // Already in or above the viewport on load / after a fast scroll: reveal now.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      reveal(el);
    } else {
      pending.add(el);
      observer.observe(el);
    }
  });

  // Safety net: reveal anything the observer skipped past during a fast scroll.
  let ticking = false;
  const sweep = () => {
    ticking = false;
    pending.forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        reveal(el);
        observer.unobserve(el);
        pending.delete(el);
      }
    });
    if (!pending.size) {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    }
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(sweep);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
}
