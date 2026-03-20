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
  TrendingUp,
  TrendingDown,
  Wallet,
  Home,
  Sparkles,
  Clock,
  Scale,
  Medal,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { useApiData } from '@/lib/hooks/useApiData';
import { useSections } from './SectionContext';

import { getColorForUser } from '@/lib/constants/colors';

const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clasificación', href: '/standings', icon: Trophy },
  { name: 'Jugadores', href: '/players', icon: User },
  { name: 'Mercado', href: '/market', icon: ShoppingCart },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Alineaciones', href: '/schedule', icon: Users },
  { name: 'Jornadas', href: '/rounds', icon: Clock },
  { name: 'Torneos', href: '/tournaments', icon: Medal },
  { name: 'Comparativa', href: '/compare', icon: Scale },
  { name: 'Porras', href: '/predictions', icon: Target },
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser, isReady } = useClientUser();
  const { sections } = useSections();
  const [isSectionsVisible, setIsSectionsVisible] = useState(true);
  const [isMembersVisible, setIsMembersVisible] = useState(false);

  // Reset section visibility on route change
  // Reset section visibility on route change
  useEffect(() => {
    // Defer to avoid synchronous state update warning during render cycle
    const t = setTimeout(() => setIsSectionsVisible(true), 0);
    return () => clearTimeout(t);
  }, [pathname]);

  // Fetch squad data for Quick Stats widget
  const { data: squadData, loading } = useApiData(
    () => (currentUser ? `/api/player/squad?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  // Fetch all users for the members list
  const { data: users = [] } = useApiData('/api/users');

  const sidebarWidth = isCollapsed ? 'w-16' : 'w-64';

  // Format large numbers as compact (e.g., 15.2M)
  const formatCompact = (value) => {
    if (!value) return '—';
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  // Calculate trend percentage
  const getTrendPercent = () => {
    if (!squadData?.total_value || !squadData?.price_trend) return null;
    const percent = (squadData.price_trend / squadData.total_value) * 100;
    return percent.toFixed(1);
  };

  const trendPercent = getTrendPercent();
  const isPositiveTrend = squadData?.price_trend >= 0;

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

        {/* League Members Legend */}
        <div className="px-4 py-3 border-t border-white/5">
          {!isCollapsed && (
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest font-display">
                Miembros
              </h3>
              <button
                onClick={() => setIsMembersVisible(!isMembersVisible)}
                className="p-1 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors cursor-pointer"
              >
                <ChevronLeft
                  size={12}
                  className={`transition-transform duration-300 ${!isMembersVisible ? 'rotate-90' : '-rotate-90'}`}
                />
              </button>
            </div>
          )}

          <div
            className={`space-y-1 overflow-hidden transition-all duration-300 ${isMembersVisible && !isCollapsed ? 'max-h-72 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            {Array.isArray(users) &&
              users.map((member) => {
                const { id, name, color_index } = member;
                const color = getColorForUser(id, name, color_index);

                return (
                  <Link
                    key={id}
                    href={`/user/${id}`}
                    className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/5 transition-all group"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ring-4 ring-white/5 ${color.text.replace('text-', 'bg-')}`}
                      style={{ backgroundColor: color.stroke }}
                    />
                    <span
                      className={`text-xs font-medium transition-colors truncate ${color.text} opacity-80 group-hover:opacity-100`}
                    >
                      {name}
                    </span>
                  </Link>
                );
              })}
          </div>
        </div>

        {/* Quick Stats Widget (only when expanded) */}
        {!isCollapsed && isReady && (
          <div className="px-3 py-4 border-t border-white/5">
            <Link href={currentUser ? `/user/${currentUser.id}` : '/dashboard'}>
              <div className="stat-card backdrop-blur-md bg-white/5 p-4 transition-all duration-500 hover:scale-[1.02] cursor-pointer group">
                <div className="flex items-center gap-2 text-[16px] font-display text-slate-400 uppercase tracking-widest mb-3">
                  <Wallet size={12} className="text-primary/70" />
                  <span>Mi Plantilla</span>
                </div>
                {loading ? (
                  <div className="h-8 w-24 bg-white/5 rounded-lg animate-shimmer" />
                ) : squadData ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl text-white font-display tracking-tight">
                        {formatCompact(squadData.total_value)}
                      </span>
                      {trendPercent && (
                        <span
                          className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isPositiveTrend ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'}`}
                        >
                          {isPositiveTrend ? (
                            <TrendingUp size={10} className="mr-1" />
                          ) : (
                            <TrendingDown size={10} className="mr-1" />
                          )}
                          {isPositiveTrend ? '+' : ''}
                          {trendPercent}%
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-white/5">
                      <div>
                        <div className="text-lg font-display text-white tracking-wider">
                          {squadData.player_count || 0}
                        </div>
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">
                          jugadores
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-display text-primary tracking-wider">
                          {new Intl.NumberFormat('es-ES').format(squadData.total_points || 0)}
                        </div>
                        <div className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">
                          puntos
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500 italic py-2">Selecciona usuario</div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Collapsed state: just icons for quick stats */}
        {isCollapsed && (
          <div className="px-2 py-4 border-t border-white/5 space-y-2">
            <Link
              href={currentUser ? `/user/${currentUser.id}` : '/dashboard'}
              className="w-full p-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-primary transition-all flex items-center justify-center group"
              title={
                squadData ? `Mi Plantilla ${formatCompact(squadData.total_value)}` : 'Mi Plantilla'
              }
            >
              <Wallet size={20} className="group-hover:scale-110 transition-transform" />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
