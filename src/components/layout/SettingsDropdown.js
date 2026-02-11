'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Sun, Moon, Check, Snowflake } from 'lucide-react'; // Added Snowflake
import { useTheme } from '@/contexts/ThemeContext';

export default function SettingsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [language, setLanguage] = useState('es');
  const dropdownRef = useRef(null);

  // Destructure new snow properties
  const { theme, setTheme, showSnow, toggleSnow } = useTheme();

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
    console.log('Language changed to:', newLanguage);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors ${
          isOpen ? 'bg-secondary text-foreground' : ''
        }`}
        aria-label="Settings"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50">
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

          {/* Effects Section (Hidden for now) */}
          {/* <div className="p-2 border-t border-border/30">
            <div className="text-xs text-muted-foreground uppercase tracking-wider px-2 py-1 mb-1">
              Efectos
            </div>
            <button
              onClick={toggleSnow}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all cursor-pointer ${
                showSnow
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Snowflake size={16} />
                <span className="text-sm">Nieve</span>
              </div>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${
                  showSnow ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                    showSnow ? 'left-4.5' : 'left-0.5'
                  }`}
                  style={{ left: showSnow ? 'calc(100% - 14px)' : '2px' }}
                />
              </div>
            </button>
          </div> */}

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
