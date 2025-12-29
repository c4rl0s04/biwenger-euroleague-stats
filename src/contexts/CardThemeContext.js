'use client';

import { createContext, useContext } from 'react';

// Static theme configuration - can be changed here to switch themes globally
const DEFAULT_THEME = 'mesh';

const CardThemeContext = createContext({
  theme: DEFAULT_THEME,
  setTheme: () => {},
});

export function CardThemeProvider({ children }) {
  // Static theme - no localStorage, no state changes
  // To change the theme, modify DEFAULT_THEME above
  const theme = DEFAULT_THEME;
  const setTheme = () => {}; // No-op - theme is static

  return (
    <CardThemeContext.Provider value={{ theme, setTheme }}>{children}</CardThemeContext.Provider>
  );
}

export const useCardTheme = () => useContext(CardThemeContext);
