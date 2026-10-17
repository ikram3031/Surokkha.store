import { useEffect, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const STORAGE_PREFIX = 'dash-scroll:';
const RESTORE_TIMEOUT_MS = 2500;

// Reads a saved scroll offset for a history entry key from sessionStorage
const readOffset = (key) => {
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw === null ? null : Number(raw);
  } catch {
    return null;
  }
};

// Writes a scroll offset for a history entry key into sessionStorage
const writeOffset = (key, value) => {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, String(Math.round(value)));
  } catch {
    return;
  }
};

// Saves and restores the scroll position of an inner scroll container per history entry, restoring only on back/forward
export const useScrollRestore = (containerRef) => {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const key = location.key;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => writeOffset(key, el.scrollTop));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('scroll', onScroll);
    };
  }, [containerRef, location.key]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const target = navigationType === 'POP' ? readOffset(location.key) : null;
    if (target === null || target <= 0) {
      el.scrollTop = 0;
      return undefined;
    }

    const startedAt = Date.now();
    let frame = 0;
    const tryRestore = () => {
      const maxScroll = el.scrollHeight - el.clientHeight;
      if (maxScroll >= target || Date.now() - startedAt > RESTORE_TIMEOUT_MS) {
        el.scrollTop = Math.min(target, Math.max(0, maxScroll));
        return;
      }
      frame = requestAnimationFrame(tryRestore);
    };
    tryRestore();
    return () => cancelAnimationFrame(frame);
  }, [containerRef, location.key, navigationType]);
};
