import {
  applyTheme,
  parseThemePreference,
  readThemePreference,
  resolveTheme,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemePreference,
} from './preferences';

export type ThemeSnapshot = { theme: ThemePreference; resolvedTheme: ResolvedTheme };

// Stable SSR/hydration snapshot. CSS and the head script own first-paint colors;
// React never needs to withhold the server-rendered children to determine them.
export const SERVER_THEME: ThemeSnapshot = { theme: 'system', resolvedTheme: 'light' };

export function createThemeStore(target: Window) {
  const media = target.matchMedia(THEME_MEDIA_QUERY);
  let theme = readThemePreference(target);
  let snapshot: ThemeSnapshot = { theme, resolvedTheme: resolveTheme(theme, media.matches) };
  const listeners = new Set<() => void>();

  function update() {
    const resolvedTheme = resolveTheme(theme, media.matches);
    applyTheme(target.document, resolvedTheme);
    if (snapshot.theme !== theme || snapshot.resolvedTheme !== resolvedTheme) {
      snapshot = { theme, resolvedTheme };
      listeners.forEach((listener) => listener());
    }
  }

  function onStorage(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      theme = readThemePreference(target);
      update();
    }
  }

  return {
    getSnapshot: () => snapshot,
    setTheme(value: ThemePreference) {
      theme = parseThemePreference(value);
      try {
        target.localStorage.setItem(THEME_STORAGE_KEY, theme);
      } catch {
        // Preferences still work for this page when storage is unavailable.
      }
      update();
    },
    subscribe(listener: () => void) {
      if (listeners.size === 0) {
        media.addEventListener('change', update);
        target.addEventListener('storage', onStorage);
      }
      listeners.add(listener);
      // Reconcile OS changes between bootstrap and hydration / Strict Mode remounts.
      update();
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          media.removeEventListener('change', update);
          target.removeEventListener('storage', onStorage);
        }
      };
    },
  };
}

let browserStore: ReturnType<typeof createThemeStore> | undefined;
function getBrowserStore() {
  return (browserStore ??= createThemeStore(window));
}

export const subscribeTheme = (listener: () => void) => getBrowserStore().subscribe(listener);
export const getThemeSnapshot = () => getBrowserStore().getSnapshot();
export const getServerThemeSnapshot = () => SERVER_THEME;
export const setThemePreference = (theme: ThemePreference) => getBrowserStore().setTheme(theme);
