'use client';

import { createContext, useContext, useState } from 'react';

const CardThemeContext = createContext({
  theme: 'standard',
  setTheme: () => {},
});

export function CardThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Lazy initialization: read from localStorage on first render (client-side only)
    if (typeof window === 'undefined') return 'standard';
    return localStorage.getItem('card-theme') || 'standard';
  });

  const handleSetTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('card-theme', newTheme);
  };

  return (
    <CardThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </CardThemeContext.Provider>
  );
}

export const useCardTheme = () => useContext(CardThemeContext);
