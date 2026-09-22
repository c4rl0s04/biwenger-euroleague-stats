'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { ThemePreference, ResolvedTheme } from '@/lib/theme/preferences';
export type { ThemePreference, ResolvedTheme } from '@/lib/theme/preferences';
import {
  getServerThemeSnapshot,
  getThemeSnapshot,
  setThemePreference,
  subscribeTheme,
} from '@/lib/theme/browser-store';

type ThemeContextValue = {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  showSnow: boolean;
  toggleSnow: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
  showSnow: false,
  toggleSnow: () => {},
});

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Helper to check if we're on the client
function subscribe() {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

// Preserve the independent snow preference and its false default.
function getStoredSnow() {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('showSnow');
    if (stored !== null) return stored === 'true';
  } catch {}
  return false;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const { theme, resolvedTheme } = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot
  );
  const [showSnow, setShowSnowState] = useState(() => getStoredSnow());

  // Effect for Snow
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('showSnow', String(showSnow));
    } catch {}
  }, [showSnow, isClient]);

  // New toggle function
  const toggleSnow = () => setShowSnowState((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme: setThemePreference,
        showSnow: isClient && showSnow,
        toggleSnow,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
