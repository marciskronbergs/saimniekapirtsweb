// Brings an element to the top of the booking popup's scroll area. The popup
// scrolls inside itself (the page behind is locked), so scrollIntoView would
// move the wrong thing; this finds the nearest ancestor that actually scrolls.
export const scrollIntoPopup = (el: HTMLElement | null) => {
  const scrolls = (node: HTMLElement) =>
    node.scrollHeight > node.clientHeight + 1 &&
    ['auto', 'scroll'].includes(getComputedStyle(node).overflowY);
  let scroller = el?.parentElement ?? null;
  while (scroller && !scrolls(scroller)) {
    scroller = scroller.parentElement;
  }
  if (!el || !scroller) return;
  scroller.scrollTo({
    top: scroller.scrollTop + el.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 16,
  });
};
