// Locks page scroll behind a drawer. Hiding the scrollbar widens the page, so its width is given
// back: as body padding for the page content, and as --scroll-lock-gap for fixed bars
// (.lock-gap-pad / .lock-gap-shift in index.css). Without this the page and the bottom bar jump
// sideways on open and close. Phones with overlay scrollbars get a width of 0, so nothing changes there.
export function setBodyScrollLocked(locked) {
  if (typeof document === 'undefined') return;
  const { body, documentElement } = document;
  if (locked) {
    if (body.style.overflow === 'hidden') return;
    const gap = Math.max(0, window.innerWidth - documentElement.clientWidth);
    body.style.overflow = 'hidden';
    body.style.paddingRight = gap ? `${gap}px` : '';
    documentElement.style.setProperty('--scroll-lock-gap', `${gap}px`);
  } else {
    body.style.overflow = '';
    body.style.paddingRight = '';
    documentElement.style.removeProperty('--scroll-lock-gap');
  }
}
