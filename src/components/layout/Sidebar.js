'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Trophy,
  Users,
  User,
  ShoppingCart,
  Calendar,
  Target,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clasificación', href: '/standings', icon: Trophy },
  { name: 'Jugadores', href: '/players', icon: User },
  { name: 'Mercado', href: '/market', icon: ShoppingCart },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Alineaciones', href: '/lineups', icon: Users },
  { name: 'Porras', href: '/porras', icon: Target },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:sticky top-0 left-0 h-screen z-50
          ${sidebarWidth}
          bg-[hsl(220,20%,5%)] border-r border-border/50
          flex flex-col
          transition-all duration-300 ease-in-out
          md:top-16 md:h-[calc(100vh-4rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header (only visible on mobile) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/30 md:hidden">
          <Link href="/" className="flex items-center gap-3" onClick={onClose}>
            <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent whitespace-nowrap">
              Biwenger Stats
            </span>
          </Link>

          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-800 text-slate-400"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:flex items-center justify-end px-2 py-2 border-b border-border/30">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary border-l-2 border-primary'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon size={20} className={isActive ? 'text-primary' : 'text-slate-400'} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
