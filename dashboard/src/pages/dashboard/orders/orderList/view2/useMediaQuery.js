import { useCallback, useSyncExternalStore } from 'react';

// Returns true while the CSS media query matches (e.g. '(min-width: 640px)')
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (callback) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query]
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false
  );
}

// Tailwind `sm` breakpoint
export const useIsWide = () => useMediaQuery('(min-width: 640px)');
