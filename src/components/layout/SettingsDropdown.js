'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * SettingsDropdown - Settings menu with language and theme options
 */
export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('es');
  const dropdownRef = useRef(null);
  const { theme, setTheme } = useTheme();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
  ];

  const themes = [
    { id: 'light', name: 'Claro', icon: Sun },
    { id: 'dark', name: 'Oscuro', icon: Moon },
  ];

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    // TODO: Implement actual language change
    console.log('Language changed to:', newLanguage);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors ${
          isOpen ? 'bg-slate-800 text-white' : ''
        }`}
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50">
          {/* Header */}
          <div className="px-3 py-2 border-b border-border/30">
            <h3 className="text-sm font-semibold text-foreground">Configuración</h3>
          </div>

          {/* Theme Section */}
          <div className="p-2">
            <div className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1">
              Tema
            </div>
            <div className="grid grid-cols-2 gap-1">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    theme === t.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground border border-transparent'
                  }`}
                >
                  <t.icon size={16} />
                  <span className="text-sm">{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Language Section */}
          <div className="p-2 border-t border-border/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1">
              Idioma
            </div>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  language === lang.code
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left text-sm">{lang.name}</span>
                {language === lang.code && <Check size={16} className="text-primary" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
