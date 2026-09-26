'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSections } from '../shared/SectionContext';
import { NAV_ITEMS, isNavigationItemActive } from '../shared/navigation';

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { sections } = useSections();
  const [isSectionsVisible, setIsSectionsVisible] = useState(true);

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  // Reset section visibility on route change
  useEffect(() => {
    const t = setTimeout(() => setIsSectionsVisible(true), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Auto-collapse on tablet viewports (768px - 1023px)
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    if (!tablet.matches) return undefined;
    const collapseTimer = window.setTimeout(() => setIsCollapsed(true), 0);
    return () => window.clearTimeout(collapseTimer);
  }, []);

  return (
    <aside
      className={`
        hidden md:sticky md:flex top-16 left-0 h-[calc(100dvh-4rem)] z-30
        ${sidebarWidth}
        bg-card/60 backdrop-blur-xl border-r border-border/40
        flex-col
        transition-all duration-300 ease-in-out
        ${className}
      `}
      aria-label="Navegación principal"
    >
      {/* Desktop Collapse / Expand Toggle */}
      <div className="flex items-center h-14 px-4 border-b border-border/30 justify-center">
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-all duration-200 hover:text-foreground group cursor-pointer"
          aria-label={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
        >
          {isCollapsed ? (
            <ChevronRight size={18} className="group-hover:scale-110" aria-hidden="true" />
          ) : (
            <ChevronLeft size={18} className="group-hover:scale-110" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden sidebar-scroll">
        <ul className="space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavigationItemActive(pathname, item.href);
            const hasSections = isActive && sections.length > 0;

            return (
              <li key={item.name}>
                <div className="relative flex items-center">
                  <Link
                    href={item.href}
                    className={`
                      group flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl
                      transition-all duration-200 relative overflow-hidden
                      ${
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      size={20}
                      className={`transition-all duration-200 shrink-0 ${
                        isActive
                          ? 'text-primary drop-shadow-[0_0_8px_hsla(19,99%,49%,0.4)] scale-105'
                          : 'group-hover:text-foreground group-hover:scale-105'
                      }`}
                      aria-hidden="true"
                    />
                    {!isCollapsed && (
                      <span className="text-sm whitespace-nowrap transition-transform duration-200 truncate">
                        {item.name}
                      </span>
                    )}
                  </Link>

                  {/* Dynamic Sections Toggle Button */}
                  {!isCollapsed && hasSections && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsSectionsVisible(!isSectionsVisible);
                      }}
                      className="absolute right-2 p-1 rounded-full hover:bg-primary/20 text-primary/70 hover:text-primary transition-all duration-200 cursor-pointer"
                      aria-label={
                        isSectionsVisible
                          ? 'Ocultar secciones de página'
                          : 'Mostrar secciones de página'
                      }
                      aria-expanded={isSectionsVisible}
                    >
                      <ChevronLeft
                        size={14}
                        className={`transition-transform duration-200 ${
                          isSectionsVisible ? '-rotate-90' : 'rotate-0'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  )}
                </div>

                {/* Dynamic Sections Sub-list */}
                {!isCollapsed && hasSections && isSectionsVisible && (
                  <ul className="mt-1 ml-4 space-y-0.5 border-l border-border/40 pl-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <Link
                          href={`${pathname}#${section.id}`}
                          className="block px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors truncate"
                        >
                          {section.title || section.id}
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
  );
}

export default Sidebar;
