'use client';

import { useState } from 'react';
import { Search, Settings } from 'lucide-react';
import { AppBrand } from '../shared/AppBrand';
import { NavigationLink } from '../shared/NavigationFeedback';
import { GlobalSearch } from '../integrations/GlobalSearch';
import { SeasonSelector } from '../integrations/SeasonSelector';
import { AccountMenu } from '../integrations/AccountMenu';

export interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header
      className={`app-top-header bg-surface-card/60 backdrop-blur-xl border-b border-border-default/40 sticky top-0 z-40 transition-colors duration-300 ${className}`}
      style={{
        boxSizing: 'border-box',
        height: 'calc(var(--app-header-height) + var(--app-safe-area-top))',
        paddingTop: 'var(--app-safe-area-top)',
      }}
    >
      {/* Subtle brand accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-action-primary/40 to-transparent opacity-70"
        aria-hidden="true"
      />

      <div className="app-top-header-inner h-16 flex items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          <AppBrand />
        </div>

        {/* Center: Global Search (desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <GlobalSearch />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Tablet Search Toggle (< 1024px) */}
          <button
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            className="shell-action lg:hidden touch-target p-2 rounded-xl hover:bg-surface-secondary text-content-muted hover:text-content-primary transition-colors cursor-pointer"
            aria-label={searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
            aria-expanded={searchOpen}
          >
            <Search size={20} aria-hidden="true" />
          </button>

          {/* Settings Navigation Link */}
          <NavigationLink
            href="/settings"
            navigationLabel="Ajustes"
            className="hidden lg:flex p-2 rounded-xl hover:bg-surface-secondary text-content-muted hover:text-content-primary transition-colors cursor-pointer"
            aria-label="Ajustes"
            title="Ajustes"
          >
            <Settings size={20} aria-hidden="true" />
          </NavigationLink>

          {/* Season Selector */}
          <SeasonSelector />

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-border/50" aria-hidden="true" />

          {/* Account Menu */}
          <AccountMenu />
        </div>
      </div>

      {/* Expandable Search Bar for Tablet (< 1024px) */}
      {searchOpen && (
        <div className="lg:hidden absolute left-0 right-0 top-full px-4 pb-3 pt-2 bg-surface-card border-b border-border-default/50 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-150">
          <GlobalSearch autoFocus onClose={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}

export default AppHeader;
