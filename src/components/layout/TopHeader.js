'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Search, Bell } from 'lucide-react';
import { UserSelector } from '@/components/user';
import { useState } from 'react';
import SearchDropdown from './SearchDropdown';
import SettingsDropdown from './SettingsDropdown';

export default function TopHeader() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 bg-card/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-40 transition-all duration-300">
      {/* Subtle premium gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-70" />

      <div className="h-full flex items-center justify-between px-3 sm:px-4 lg:px-6">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Logo icon */}
            <div className="relative w-12 h-12 lg:w-16 lg:h-16 transition-transform group-hover:scale-105 duration-500">
              <Image
                src="/brand-logo.png"
                alt="Biwenger Stats Logo"
                fill
                priority
                unoptimized
                className="object-contain drop-shadow-[0_0_12px_hsla(19,99%,49%,0.4)]"
                sizes="64px"
              />
            </div>
            <span className="hidden sm:block text-lg lg:text-xl font-bold font-sans bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent tracking-tight">
              Biwenger
              <span className="text-primary group-hover:text-primary/90 transition-colors">
                Stats
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (desktop) */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <SearchDropdown />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="lg:hidden touch-target rounded-lg hover:bg-secondary text-muted-foreground"
            aria-label={searchOpen ? 'Cerrar búsqueda' : 'Abrir búsqueda'}
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button
            aria-label="Notificaciones"
            className="relative hidden lg:block p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell size={20} />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </button>

          {/* Settings */}
          <div className="hidden lg:flex">
            <SettingsDropdown />
          </div>

          {/* Divider */}
          <div className="hidden lg:block w-px h-6 bg-border/50" />

          {/* User Selector */}
          <UserSelector />
        </div>
      </div>

      {/* Mobile Search Bar (expandable) */}
      {searchOpen && (
        <div className="lg:hidden absolute left-0 right-0 top-full px-4 pb-3 pt-2 bg-card border-b border-border/50 shadow-2xl">
          <SearchDropdown onClose={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}
