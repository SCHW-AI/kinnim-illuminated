import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function mediaQuery(): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY)
    : null;
}

function subscribe(onChange: () => void): () => void {
  const mql = mediaQuery();
  if (!mql) return () => {};
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }
  // Safari before 14 has only the older listener API.
  mql.addListener(onChange);
  return () => mql.removeListener(onChange);
}

function snapshot(): boolean {
  return mediaQuery()?.matches ?? false;
}

/**
 * Whether the reader asks for reduced motion, kept live: it re-renders when
 * the preference changes after mount. False where there is no `matchMedia`
 * (server rendering, jsdom). Use this rather than Motion's `useReducedMotion`,
 * which keeps its first reading.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
