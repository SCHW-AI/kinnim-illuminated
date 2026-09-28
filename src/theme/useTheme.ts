import { useCallback, useSyncExternalStore } from 'react';

/** What the reader asked for. `system` follows `prefers-color-scheme`. */
export type ThemePreference = 'system' | 'light' | 'dark';
/** The theme actually in force. */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'kn-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const listeners = new Set<() => void>();
let preference: ThemePreference = readStored();

function readStored(): ThemePreference {
  try {
    const v = globalThis.localStorage?.getItem(STORAGE_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

function apply(pref: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

apply(preference);

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  const mql =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(DARK_QUERY)
      : null;
  mql?.addEventListener('change', onChange);
  return () => {
    listeners.delete(onChange);
    mql?.removeEventListener('change', onChange);
  };
}

function snapshot(): string {
  return `${preference}|${systemPrefersDark() ? 'dark' : 'light'}`;
}

/** Sets the theme preference, persists it, and applies it to `<html data-theme>`. */
export function setThemePreference(next: ThemePreference): void {
  preference = next;
  try {
    if (next === 'system') globalThis.localStorage?.removeItem(STORAGE_KEY);
    else globalThis.localStorage?.setItem(STORAGE_KEY, next);
  } catch {
    // Storage may be unavailable (private mode); the choice still applies for this page.
  }
  apply(next);
  listeners.forEach((l) => l());
}

/**
 * The reader's theme preference and the theme in force.
 * `cycle()` steps system → light → dark → system.
 */
export function useTheme(): {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (next: ThemePreference) => void;
  cycle: () => void;
} {
  const snap = useSyncExternalStore(subscribe, snapshot, () => 'system|light');
  const [pref, system] = snap.split('|') as [ThemePreference, ResolvedTheme];
  const resolved: ResolvedTheme = pref === 'system' ? system : pref;
  const cycle = useCallback(() => {
    setThemePreference(pref === 'system' ? 'light' : pref === 'light' ? 'dark' : 'system');
  }, [pref]);
  return { preference: pref, resolved, setPreference: setThemePreference, cycle };
}
