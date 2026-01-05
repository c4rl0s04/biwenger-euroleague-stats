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
} from 'lucide-react';
import { useState } from 'react';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { useApiData } from '@/lib/hooks/useApiData';

const navItems = [
  { name: 'Inicio', href: '/', icon: Home },
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
  const { currentUser, isReady } = useClientUser();

  // Fetch squad data for Quick Stats widget
  const { data: squadData, loading } = useApiData(
    () => (currentUser ? `/api/player/squad?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

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
          bg-[hsl(var(--sidebar-background))] border-r border-border/30
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
            className="p-1 rounded hover:bg-secondary text-muted-foreground"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop Header & Toggle */}
        <div className="hidden md:flex items-center h-16 px-4 border-b border-white/5">
          {!isCollapsed && (
            <Link href="/" className="flex-1 animate-fade-in">
              <span className="text-xl font-display tracking-wide bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                BIWENGER STATS
              </span>
            </Link>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
          <ul className="space-y-1.5 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group flex items-center gap-3 px-3 py-2.5 rounded-md
                      transition-all duration-300 relative overflow-hidden
                      ${
                        isActive
                          ? 'bg-gradient-to-r from-primary/10 to-transparent text-primary font-medium shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      }
                    `}
                    title={isCollapsed ? item.name : undefined}
                  >
                    {/* Active Glow Effect */}
                    {isActive && <div className="absolute inset-0 bg-primary/5 blur-xl -z-10" />}

                    <item.icon
                      size={20}
                      className={`transition-colors duration-300 ${
                        isActive
                          ? 'text-primary drop-shadow-[0_0_8px_rgba(250,80,1,0.4)]'
                          : 'group-hover:text-foreground'
                      }`}
                    />
                    {!isCollapsed && (
                      <span
                        className={`text-sm whitespace-nowrap transition-colors duration-300 ${isActive ? 'translate-x-1' : ''}`}
                      >
                        {item.name}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick Stats Widget (only when expanded) */}
        {!isCollapsed && isReady && (
          <div className="px-3 py-3 border-t border-border/30">
            <Link href="/dashboard">
              <div className="card-glow bg-secondary/50 rounded-xl p-3 border border-border/30 transition-all duration-300 cursor-pointer">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <Wallet size={14} />
                  <span>Mi Plantilla</span>
                </div>
                {loading ? (
                  <div className="h-7 w-24 bg-muted rounded animate-shimmer" />
                ) : squadData ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">
                        {formatCompact(squadData.total_value)}
                      </span>
                      {trendPercent && (
                        <span
                          className={`flex items-center text-xs ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {isPositiveTrend ? (
                            <TrendingUp size={12} className="mr-0.5" />
                          ) : (
                            <TrendingDown size={12} className="mr-0.5" />
                          )}
                          {isPositiveTrend ? '+' : ''}
                          {trendPercent}%
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border/20">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          {squadData.player_count || 0}
                        </div>
                        <div className="text-[10px] text-slate-400">jugadores</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-primary">
                          {new Intl.NumberFormat('es-ES').format(squadData.total_points || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400">puntos</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-slate-500">Selecciona usuario</div>
                )}
              </div>
            </Link>
          </div>
        )}

        {/* Collapsed state: just icons for quick stats */}
        {isCollapsed && (
          <div className="px-2 py-3 border-t border-border/30 space-y-2">
            <Link
              href="/dashboard"
              className="w-full p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
              title={
                squadData ? `Mi Plantilla ${formatCompact(squadData.total_value)}` : 'Mi Plantilla'
              }
            >
              <Wallet size={20} />
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
