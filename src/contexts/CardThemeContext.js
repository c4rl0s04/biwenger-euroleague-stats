'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const CardThemeContext = createContext({
  theme: 'standard',
  setTheme: () => {},
});

export function CardThemeProvider({ children }) {
  const [theme, setTheme] = useState('standard');

  useEffect(() => {
    // Load saved theme from local storage if available
    const savedTheme = localStorage.getItem('card-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

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
