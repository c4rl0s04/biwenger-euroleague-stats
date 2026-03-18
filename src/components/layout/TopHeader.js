'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, Bell } from 'lucide-react';
import { UserSelector } from '@/components/user';
import { useState } from 'react';
import SearchDropdown from './SearchDropdown';
import SettingsDropdown from './SettingsDropdown';

export default function TopHeader({ onMobileMenuClick }) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 bg-card/60 backdrop-blur-xl border-b border-border/40 sticky top-0 z-40 transition-all duration-300">
      {/* Subtle premium gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-70" />

      <div className="h-full flex items-center justify-between px-4 md:px-6">
        {/* Left: Mobile menu button + Logo */}
        <div className="flex items-center gap-4">
          {/* Mobile Hamburger */}
          <button
            onClick={onMobileMenuClick}
            className="md:hidden p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Logo icon */}
            <div className="relative w-14 h-14 md:w-16 md:h-16 transition-transform group-hover:scale-105 duration-500">
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
            <span className="hidden sm:block text-xl font-bold font-sans bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent tracking-tight">
              Biwenger
              <span className="text-primary group-hover:text-primary/90 transition-colors">
                Stats
              </span>
            </span>
          </Link>
        </div>

        {/* Center: Search Bar (desktop) */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <SearchDropdown />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-secondary text-muted-foreground"
            aria-label="Search"
          >
            <Search size={20} />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            <Bell size={20} />
            {/* Notification dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full animate-pulse" />
          </button>

          {/* Settings */}
          <div className="hidden sm:flex">
            <SettingsDropdown />
          </div>

          {/* Divider */}
          <div className="hidden sm:block w-px h-6 bg-border/50" />

          {/* User Selector */}
          <UserSelector />
        </div>
      </div>

      {/* Mobile Search Bar (expandable) */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3 bg-card border-b border-border/50">
          <SearchDropdown onClose={() => setSearchOpen(false)} />
        </div>
      )}
    </header>
  );
}
