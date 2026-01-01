'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
  // New properties
  showSnow: true,
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
function subscribe(callback) {
  return () => {};
}

function getSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

// Get initial theme
function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';
  try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
  } catch {}
  if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

// Get initial snow preference (default to true)
function getStoredSnow() {
  if (typeof window === 'undefined') return true;
  try {
    const stored = localStorage.getItem('showSnow');
    if (stored !== null) return stored === 'true';
  } catch {}
  return true;
}

export function ThemeProvider({ children }) {
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Lazy initialization
  const [theme, setThemeState] = useState(() => getStoredTheme());
  const [showSnow, setShowSnowState] = useState(() => getStoredSnow());

  // Effect for Theme
  useEffect(() => {
    if (!isClient) return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  }, [theme, isClient]);

  // Effect for Snow
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem('showSnow', String(showSnow));
    } catch {}
  }, [showSnow, isClient]);

  const setTheme = (newTheme) => setThemeState(newTheme);
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));

  // New toggle function
  const toggleSnow = () => setShowSnowState((prev) => !prev);

  if (!isClient) return null;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, showSnow, toggleSnow }}>
      {children}
    </ThemeContext.Provider>
  );
}
