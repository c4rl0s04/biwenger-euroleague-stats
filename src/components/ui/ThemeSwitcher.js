'use client';

import { useCardTheme } from '@/contexts/CardThemeContext';
import { Palette, Monitor, Zap, Layout, Box } from 'lucide-react';
import { useState } from 'react';

const themes = [
  { id: 'standard', name: 'Original', icon: Layout },
  { id: 'glass', name: 'Glass Premium', icon: Zap },
  { id: 'mesh', name: 'Mesh Gradient', icon: Monitor },
  { id: 'neo', name: 'Neo Linear', icon: Box },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useCardTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className={`absolute bottom-full right-0 mb-4 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-2xl transition-all duration-300 transform origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="flex flex-col gap-1 w-40">
           {themes.map(t => (
             <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  theme === t.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
             >
                <t.icon className="w-4 h-4" />
                {t.name}
             </button>
           ))}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 hover:bg-blue-500 text-white rounded-full p-3 shadow-lg hover:shadow-blue-500/25 transition-all active:scale-95 border-2 border-slate-900"
        title="Cambiar estilo"
      >
        <Palette className="w-6 h-6" />
      </button>
    </div>
  );
}
