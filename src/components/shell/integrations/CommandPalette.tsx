'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  Search,
  User,
  Trophy,
  Users,
  Snowflake,
  LayoutDashboard,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Shirt,
  Vote,
  type LucideIcon,
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface AppPage {
  name: string;
  href: string;
  icon: LucideIcon;
  keywords: string[];
}

interface SearchPlayerResult {
  id: string | number;
  name: string;
  team?: string;
}

interface SearchTeamResult {
  id: string | number;
  name: string;
}

interface SearchUserResult {
  id: string | number;
  name: string;
}

interface SearchResults {
  players: SearchPlayerResult[];
  teams: SearchTeamResult[];
  users: SearchUserResult[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResults>({ players: [], teams: [], users: [] });
  const router = useRouter();
  const { toggleSnow, showSnow } = useTheme();

  const inputRef = useRef<HTMLInputElement>(null);

  const appPages: AppPage[] = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'inicio'] },
    { name: 'Clasificación', href: '/standings', icon: TrendingUp, keywords: ['ranking', 'tabla'] },
    { name: 'Mercado', href: '/market', icon: ShoppingBag, keywords: ['fichajes', 'compras'] },
    { name: 'Partidos', href: '/matches', icon: Calendar, keywords: ['jornada', 'calendario'] },
    { name: 'Alineaciones', href: '/schedule', icon: Shirt, keywords: ['equipos', 'onues'] },
    { name: 'Porras', href: '/predictions', icon: Vote, keywords: ['apuestas', 'predicciones'] },
  ];

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus when opened
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Fetch search results (API)
  useEffect(() => {
    if (query.length < 2) {
      setResults({ players: [], teams: [], users: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = (await apiClient.get(`/api/search?q=${encodeURIComponent(query)}`)) as {
          data?: SearchResults;
        };
        setResults(res.data || { players: [], teams: [], users: [] });
      } catch (error) {
        console.error('CommandPalette search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter pages client-side
  const filteredPages =
    query === ''
      ? []
      : appPages.filter(
          (page) =>
            page.name.toLowerCase().includes(query.toLowerCase()) ||
            page.keywords.some((k) => k.includes(query.toLowerCase()))
        );

  const handleSelect = (callback: () => void) => {
    callback();
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <Command
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        shouldFilter={false}
      >
        <div className="flex items-center border-b border-border px-4" cmdk-input-wrapper="">
          <Search className="w-5 h-5 text-muted-foreground mr-2 shrink-0" />
          <Command.Input
            ref={inputRef}
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar página, jugador, equipo..."
            className="flex-1 h-14 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2">
          {/* Default View (No Query) */}
          {!loading && query.length === 0 && (
            <>
              <Command.Group
                heading="Acciones Rápidas"
                className="text-xs font-medium text-muted-foreground mb-2 px-2"
              >
                {appPages.slice(0, 3).map((page) => (
                  <CommandPaletteItem
                    key={page.name}
                    icon={page.icon}
                    onSelect={() => handleSelect(() => router.push(page.href))}
                  >
                    Ir a {page.name}
                  </CommandPaletteItem>
                ))}
              </Command.Group>

              <Command.Group
                heading="Configuración"
                className="text-xs font-medium text-muted-foreground mb-2 px-2"
              >
                <CommandPaletteItem
                  icon={Snowflake}
                  onSelect={() => handleSelect(() => toggleSnow())}
                >
                  {showSnow ? 'Desactivar Nieve' : 'Activar Nieve'}
                </CommandPaletteItem>
              </Command.Group>
            </>
          )}

          {/* Search Results */}
          {query.length > 0 && (
            <>
              {filteredPages.length > 0 && (
                <Command.Group
                  heading="Páginas"
                  className="text-xs font-medium text-purple-400/80 mb-2 px-2"
                >
                  {filteredPages.map((p) => (
                    <CommandPaletteItem
                      key={p.name}
                      type="page"
                      icon={p.icon}
                      onSelect={() => handleSelect(() => router.push(p.href))}
                    >
                      Ir a {p.name}
                    </CommandPaletteItem>
                  ))}
                </Command.Group>
              )}

              {loading && (
                <Command.Loading className="p-4 text-center text-muted-foreground">
                  Buscando...
                </Command.Loading>
              )}

              {!loading && (
                <>
                  {results.players.length > 0 && (
                    <Command.Group
                      heading="Jugadores"
                      className="text-xs font-medium text-blue-400/80 mb-2 px-2"
                    >
                      {results.players.map((p) => (
                        <CommandPaletteItem
                          key={p.id}
                          type="player"
                          icon={User}
                          onSelect={() => handleSelect(() => router.push(`/player/${p.id}`))}
                        >
                          <span className="font-medium">{p.name}</span>
                          {p.team && (
                            <span className="ml-2 text-xs opacity-70 font-normal">{p.team}</span>
                          )}
                        </CommandPaletteItem>
                      ))}
                    </Command.Group>
                  )}

                  {results.teams.length > 0 && (
                    <Command.Group
                      heading="Equipos"
                      className="text-xs font-medium text-amber-400/80 mb-2 px-2"
                    >
                      {results.teams.map((t) => (
                        <CommandPaletteItem
                          key={t.name}
                          type="team"
                          icon={Trophy}
                          onSelect={() => handleSelect(() => router.push(`/team/${t.id}`))}
                        >
                          {t.name}
                        </CommandPaletteItem>
                      ))}
                    </Command.Group>
                  )}

                  {results.users.length > 0 && (
                    <Command.Group
                      heading="Usuarios"
                      className="text-xs font-medium text-emerald-400/80 mb-2 px-2"
                    >
                      {results.users.map((u) => (
                        <CommandPaletteItem
                          key={u.id}
                          type="user"
                          icon={Users}
                          onSelect={() => handleSelect(() => router.push(`/user/${u.id}`))}
                        >
                          {u.name}
                        </CommandPaletteItem>
                      ))}
                    </Command.Group>
                  )}
                </>
              )}
            </>
          )}

          {!loading &&
            query.length > 1 &&
            filteredPages.length === 0 &&
            results.players.length === 0 &&
            results.teams.length === 0 &&
            results.users.length === 0 && (
              <div className="py-14 text-center text-muted-foreground text-sm">
                No se encontraron resultados.
              </div>
            )}
        </Command.List>
      </Command>
    </div>
  );
}

interface CommandPaletteItemProps {
  children: ReactNode;
  icon?: LucideIcon;
  onSelect: () => void;
  type?: 'default' | 'page' | 'player' | 'team' | 'user';
}

function CommandPaletteItem({
  children,
  icon: Icon,
  onSelect,
  type = 'default',
}: CommandPaletteItemProps) {
  const getTypeStyles = () => {
    switch (type) {
      case 'page':
        return 'aria-selected:bg-purple-500/10 aria-selected:text-purple-400 text-muted-foreground';
      case 'player':
        return 'aria-selected:bg-blue-500/10 aria-selected:text-blue-400 text-muted-foreground';
      case 'team':
        return 'aria-selected:bg-amber-500/10 aria-selected:text-amber-400 text-muted-foreground';
      case 'user':
        return 'aria-selected:bg-emerald-500/10 aria-selected:text-emerald-400 text-muted-foreground';
      default:
        return 'aria-selected:bg-primary/10 aria-selected:text-primary text-muted-foreground';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'page':
        return 'text-purple-400';
      case 'player':
        return 'text-blue-400';
      case 'team':
        return 'text-amber-400';
      case 'user':
        return 'text-emerald-400';
      default:
        return 'text-current';
    }
  };

  return (
    <Command.Item
      onSelect={onSelect}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer text-sm transition-colors ${getTypeStyles()}`}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors ${
            type !== 'default' ? getIconColor() : ''
          }`}
        />
      )}
      <div className="flex-1 flex items-center">{children}</div>
    </Command.Item>
  );
}
export default CommandPalette;
