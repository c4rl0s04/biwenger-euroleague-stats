'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, User, Users, Trophy, X, Loader2, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/foundation';
import { apiClient } from '@/lib/api-client';
import { useNavigationFeedback } from '../shared/NavigationFeedback';

export interface GlobalSearchProps {
  onClose?: () => void;
  className?: string;
  autoFocus?: boolean;
}

interface PlayerItem {
  id: string | number;
  name: string;
  team?: string;
  position?: string;
}

interface TeamItem {
  id: string | number;
  name: string;
}

interface UserItem {
  id: string | number;
  name: string;
}

interface SearchApiResponse {
  players?: PlayerItem[];
  teams?: TeamItem[];
  users?: UserItem[];
}

type SearchResultItem =
  | ({ type: 'player' } & PlayerItem)
  | ({ type: 'team' } & TeamItem)
  | ({ type: 'user' } & UserItem);

export function GlobalSearch({ onClose, className = '', autoFocus = false }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    players: PlayerItem[];
    teams: TeamItem[];
    users: UserItem[];
  }>({ players: [], teams: [], users: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { beginNavigation } = useNavigationFeedback();

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ players: [], teams: [], users: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = (await apiClient.get(`/api/search?q=${encodeURIComponent(query)}`)) as {
          data?: SearchApiResponse;
        };
        setResults({
          players: res.data?.players || [],
          teams: res.data?.teams || [],
          users: res.data?.users || [],
        });
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Build flat list for keyboard navigation
  const allResults = useMemo<SearchResultItem[]>(
    () => [
      ...results.players.map((p) => ({ type: 'player' as const, ...p })),
      ...results.teams.map((t) => ({ type: 'team' as const, ...t })),
      ...results.users.map((u) => ({ type: 'user' as const, ...u })),
    ],
    [results]
  );

  const handleSelect = useCallback(
    (item: SearchResultItem) => {
      setIsOpen(false);
      setQuery('');
      if (item.type === 'player') {
        beginNavigation(`/player/${item.id}`, item.name);
        router.push(`/player/${item.id}`);
      } else if (item.type === 'team') {
        beginNavigation(`/team/${item.id}`, item.name);
        router.push(`/team/${item.id}`);
      } else if (item.type === 'user') {
        beginNavigation(`/user/${item.id}`, item.name);
        router.push(`/user/${item.id}`);
      }
      onClose?.();
    },
    [router, onClose, beginNavigation]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => Math.min(prev + 1, allResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        const item = allResults[activeIndex];
        if (item) handleSelect(item);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        onClose?.();
      }
    },
    [isOpen, activeIndex, allResults, onClose, handleSelect]
  );

  const hasResults = allResults.length > 0;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'player':
        return {
          iconColor: 'text-blue-400',
          activeBg: 'bg-blue-500/10',
          activeText: 'text-blue-400',
        };
      case 'team':
        return {
          iconColor: 'text-amber-400',
          activeBg: 'bg-amber-500/10',
          activeText: 'text-amber-400',
        };
      case 'user':
        return {
          iconColor: 'text-emerald-400',
          activeBg: 'bg-emerald-500/10',
          activeText: 'text-emerald-400',
        };
      default:
        return {
          iconColor: 'text-muted-foreground',
          activeBg: 'bg-secondary',
          activeText: 'text-foreground',
        };
    }
  };

  const renderItem = (
    item: SearchResultItem,
    index: number,
    icon: LucideIcon,
    subtitle: string | null
  ) => {
    const isActive = activeIndex === index;
    const Icon = icon;
    const styles = getTypeStyles(item.type);

    return (
      <button
        key={`${item.type}-${item.id || item.name}`}
        type="button"
        onClick={() => handleSelect(item)}
        onMouseEnter={() => setActiveIndex(index)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-sm transition-colors ${
          isActive
            ? `${styles.activeBg} ${styles.activeText}`
            : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
        }`}
      >
        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-current' : styles.iconColor}`} />
        <div className="flex-1 flex flex-col items-start min-w-0">
          <span className={`font-medium truncate ${isActive ? 'text-current' : 'text-foreground'}`}>
            {item.name}
          </span>
          {subtitle && (
            <span
              className={`text-xs truncate font-normal ${isActive ? 'opacity-80' : 'text-muted-foreground'}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Search Input */}
      <div className="relative group">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar..."
          aria-label="Buscar jugadores, equipos y mánagers"
          className="w-full pl-10 pr-10 py-2 rounded-xl bg-secondary border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin"
            aria-hidden="true"
          />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setResults({ players: [], teams: [], users: [] });
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/50 rounded-xl shadow-xl shadow-black/20 overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {!hasResults && !loading && (
            <EmptyState className="p-4">
              No se encontraron resultados para &ldquo;{query}&rdquo;
            </EmptyState>
          )}

          {/* Players */}
          {results.players.length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1.5 text-xs font-semibold text-blue-400/80 uppercase tracking-wider mb-1">
                Jugadores
              </div>
              {results.players.map((player, idx) =>
                renderItem(
                  { type: 'player', ...player },
                  idx,
                  User,
                  player.team && player.position
                    ? `${player.team} · ${player.position}`
                    : player.team || null
                )
              )}
            </div>
          )}

          {/* Teams */}
          {results.teams.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-2 py-1.5 text-xs font-semibold text-amber-400/80 uppercase tracking-wider mb-1">
                Equipos
              </div>
              {results.teams.map((team, idx) => {
                const globalIdx = results.players.length + idx;
                return renderItem({ type: 'team', ...team }, globalIdx, Trophy, null);
              })}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="p-2 border-t border-border/30">
              <div className="px-2 py-1.5 text-xs font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">
                Usuarios
              </div>
              {results.users.map((user, idx) => {
                const globalIdx = results.players.length + results.teams.length + idx;
                return renderItem({ type: 'user', ...user }, globalIdx, Users, null);
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
