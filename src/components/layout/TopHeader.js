'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';
import { UserSelector } from '@/components/user';

export default function TopHeader({ onMobileMenuClick }) {
  return (
    <header className="h-16 bg-[hsl(220,20%,5%)] border-b border-border/50 sticky top-0 z-40">
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
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
              Biwenger Stats
            </span>
          </Link>
        </div>

        {/* Right: User Selector */}
        <div className="flex items-center gap-4">
          <UserSelector />
        </div>
      </div>
    </header>
  );
}
