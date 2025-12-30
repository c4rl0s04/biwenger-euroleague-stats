'use client';

import Link from 'next/link';
import { Menu, Search, Bell, Settings } from 'lucide-react';
import { UserSelector } from '@/components/user';
import { useState } from 'react';

export default function TopHeader({ onMobileMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 bg-[hsl(220,20%,5%)]/95 backdrop-blur-xl border-b border-border/50 sticky top-0 z-40">
      {/* Subtle gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left: Mobile menu button + Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            {/* Logo icon with gradient background */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <span className="text-white font-bold text-sm">BS</span>
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Biwenger Stats
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full group">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors"
            />
            <input
              type="text"
              placeholder="Buscar jugadores, equipos..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/50 border border-border/50 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-800 rounded border border-border/50">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-400"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <Bell size={20} />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </button>

          {/* Settings */}
          <button className="hidden sm:flex p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <Settings size={20} />
          </button>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-border/50" />

          {/* User Selector */}
          <UserSelector />
        </div>
      </div>

      {/* Mobile Search Bar (expandable) */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 bg-[hsl(220,20%,5%)] border-b border-border/50">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar jugadores, equipos..."
              autoFocus
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/50 border border-border/50 text-sm text-foreground placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}
    </header>
  );
}
