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
  Home,
  Sparkles,
  Clock,
  Scale,
  Medal,
  LayoutGrid,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSections } from './SectionContext';

const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clasificación', href: '/standings', icon: Trophy },
  { name: 'Jugadores', href: '/players', icon: User },
  { name: 'Mercado', href: '/market', icon: ShoppingCart },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Hoopgrid', href: '/hoopgrid', icon: LayoutGrid },
  { name: 'Alineaciones', href: '/schedule', icon: Users },
  { name: 'Jornadas', href: '/rounds', icon: Clock },
  { name: 'Torneos', href: '/tournaments', icon: Medal },
  { name: 'Comparativa', href: '/compare', icon: Scale },
  { name: 'Porras', href: '/predictions', icon: Target },
  { name: 'Playoffs', href: '/playoffs', icon: Trophy },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { sections } = useSections();
  const [isSectionsVisible, setIsSectionsVisible] = useState(true);

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  // Reset section visibility on route change
  // Reset section visibility on route change
  useEffect(() => {
    // Defer to avoid synchronous state update warning during render cycle
    const t = setTimeout(() => setIsSectionsVisible(true), 0);
    return () => clearTimeout(t);
  }, [pathname]);

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
          bg-card/40 backdrop-blur-xl border-r border-border/40
          flex flex-col
          transition-all duration-300 ease-in-out
          md:top-16 md:h-[calc(100vh-4rem)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Mobile Header (only visible on mobile) */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border/20 md:hidden">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <span className="text-lg font-bold font-sans bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent tracking-tight">
              Biwenger<span className="text-primary">Stats</span>
            </span>
          </Link>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/5 text-muted-foreground"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Toggle */}
        <div className="hidden md:flex items-center h-14 px-4 border-b border-white/5 justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl hover:bg-white/5 text-muted-foreground transition-all duration-300 hover:text-foreground group cursor-pointer"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight size={18} className="group-hover:scale-110" />
            ) : (
              <ChevronLeft size={18} className="group-hover:scale-110" />
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-6 overflow-y-auto overflow-x-hidden sidebar-scroll">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const hasSections = isActive && sections.length > 0;

              return (
                <li key={item.name}>
                  <div className="relative flex items-center">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={`
                        group flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl
                        transition-all duration-300 relative overflow-hidden
                        ${
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold shadow-[0_4px_12px_rgba(250,80,1,0.1)]'
                            : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                        }
                      `}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <item.icon
                        size={20}
                        className={`transition-all duration-300 ${
                          isActive
                            ? 'text-primary drop-shadow-[0_0_8px_rgba(250,80,1,0.4)] scale-110'
                            : 'group-hover:text-foreground group-hover:scale-110'
                        }`}
                      />
                      {!isCollapsed && (
                        <span
                          className={`text-sm whitespace-nowrap transition-transform duration-300 ${isActive ? 'translate-x-0.5' : ''}`}
                        >
                          {item.name}
                        </span>
                      )}
                    </Link>

                    {/* Collapse Toggle Button */}
                    {!isCollapsed && hasSections && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsSectionsVisible(!isSectionsVisible);
                        }}
                        className="absolute right-2 p-1 rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-all duration-200 cursor-pointer"
                      >
                        <ChevronLeft
                          size={14}
                          className={`transition-transform duration-300 ${isSectionsVisible ? '-rotate-90' : 'rotate-0'}`}
                        />
                      </button>
                    )}
                  </div>

                  {/* Sub-items Rendering (Dynamic from Context) */}
                  {!isCollapsed && hasSections && isSectionsVisible && (
                    <ul className="mt-1 ml-4 space-y-0.5 border-l border-border/30 pl-2 animate-slide-up">
                      {sections.map((section) => (
                        <li key={section.id}>
                          <Link
                            href={`${item.href}#${section.id}`}
                            className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-md transition-colors"
                          >
                            {section.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
