import { useLayoutEffect, useState, type RefObject } from 'react';

// A row of cards that rises half its height into the section above (on
// tablets and up): returns how far, in px, the section should be pulled up so
// the middle of `cards` sits on the section's top edge. Measured with layout
// offsets, not bounding boxes, so the cards' rise-in transforms don't count.
const WIDE = '(min-width: 768px)';

const offsetWithin = (el: HTMLElement, ancestor: HTMLElement) => {
  let top = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  // The ancestor wasn't the offset parent chain's: measure from the layout.
  return node === ancestor ? top : el.getBoundingClientRect().top - ancestor.getBoundingClientRect().top;
};

export const useHalfOverlap = (section: RefObject<HTMLElement>, cards: RefObject<HTMLElement>) => {
  const [overlap, setOverlap] = useState(0);
  useLayoutEffect(() => {
    const s = section.current;
    const c = cards.current;
    if (!s || !c) return;
    const query = window.matchMedia(WIDE);
    const measure = () => {
      const next = query.matches ? Math.round(offsetWithin(c, s) + c.offsetHeight / 2) : 0;
      setOverlap((prev) => (prev === next ? prev : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(c);
    query.addEventListener('change', measure);
    return () => {
      ro.disconnect();
      query.removeEventListener('change', measure);
    };
  }, [section, cards]);
  return overlap;
};
