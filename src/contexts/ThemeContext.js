'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
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

// Get initial theme from localStorage or system preference
function getStoredTheme() {
  if (typeof window === 'undefined') return 'dark';

  try {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
  } catch {
    // localStorage might not be available
  }

  if (window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

export function ThemeProvider({ children }) {
  // Use useSyncExternalStore to safely detect client-side mounting
  const isClient = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Use lazy initialization to avoid setState in effect
  const [theme, setThemeState] = useState(() => getStoredTheme());

  // Apply theme class to document when theme changes (only on client)
  useEffect(() => {
    if (!isClient) return;

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);

    try {
      localStorage.setItem('theme', theme);
    } catch {
      // localStorage might not be available
    }
  }, [theme, isClient]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Prevent flash by not rendering children until on client
  if (!isClient) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
