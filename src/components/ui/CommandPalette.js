'use client';

import { useEffect, useState, useRef } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
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
  Vote
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ players: [], teams: [], users: [] });
  const router = useRouter();
  const { toggleSnow, showSnow } = useTheme();
  
  const inputRef = useRef(null);

  // 1. Define your app pages here
  const appPages = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, keywords: ['home', 'inicio'] },
    { name: 'Clasificación', href: '/standings', icon: TrendingUp, keywords: ['ranking', 'tabla'] },
    { name: 'Mercado', href: '/market', icon: ShoppingBag, keywords: ['fichajes', 'compras'] },
    { name: 'Partidos', href: '/matches', icon: Calendar, keywords: ['jornada', 'calendario'] },
    { name: 'Alineaciones', href: '/lineups', icon: Shirt, keywords: ['equipos', 'onues'] },
    { name: 'Porras', href: '/porras', icon: Vote, keywords: ['apuestas', 'predicciones'] },
  ];

  // Toggle with Cmd+K or Ctrl+K
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Force focus whenever the palette opens
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
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.data || { players: [], teams: [], users: [] });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // 2. Filter pages client-side
  const filteredPages = query === '' 
    ? [] 
    : appPages.filter(page => 
        page.name.toLowerCase().includes(query.toLowerCase()) || 
        page.keywords.some(k => k.includes(query.toLowerCase()))
      );

  const handleSelect = (callback) => {
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
          <Search className="w-5 h-5 text-muted-foreground mr-2" />
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
              <Command.Group heading="Acciones Rápidas" className="text-xs font-medium text-muted-foreground mb-2 px-2">
                {appPages.slice(0, 3).map(page => (
                   <Item key={page.name} icon={page.icon} onSelect={() => handleSelect(() => router.push(page.href))}>
                     Ir a {page.name}
                   </Item>
                ))}
              </Command.Group>
              
              <Command.Group heading="Configuración" className="text-xs font-medium text-muted-foreground mb-2 px-2">
                <Item 
                  icon={Snowflake} 
                  onSelect={() => handleSelect(() => toggleSnow())}
                >
                  {showSnow ? 'Desactivar Nieve' : 'Activar Nieve'}
                </Item>
              </Command.Group>
            </>
          )}

          {/* Search Results */}
          {(query.length > 0) && (
            <>
              {/* 3. Render Filtered Pages (Purple) */}
              {filteredPages.length > 0 && (
                <Command.Group heading="Páginas" className="text-xs font-medium text-purple-400/70 mb-2 px-2">
                  {filteredPages.map((p) => (
                    <Item key={p.name} type="page" icon={p.icon} onSelect={() => handleSelect(() => router.push(p.href))}>
                      Ir a {p.name}
                    </Item>
                  ))}
                </Command.Group>
              )}

              {loading && <Command.Loading className="p-4 text-center text-muted-foreground">Buscando...</Command.Loading>}

              {!loading && (
                <>
                  {results.players.length > 0 && (
                    <Command.Group heading="Jugadores" className="text-xs font-medium text-blue-400/70 mb-2 px-2">
                      {results.players.map((p) => (
                        <Item key={p.id} type="player" icon={User} onSelect={() => handleSelect(() => router.push(`/player/${p.id}`))}>
                          <span className="font-medium">{p.name}</span>
                          <span className="ml-2 text-xs opacity-70 font-normal">{p.team}</span>
                        </Item>
                      ))}
                    </Command.Group>
                  )}

                  {results.teams.length > 0 && (
                    <Command.Group heading="Equipos" className="text-xs font-medium text-amber-400/70 mb-2 px-2">
                      {results.teams.map((t) => (
                        <Item key={t.name} type="team" icon={Trophy} onSelect={() => handleSelect(() => router.push(`/team/${t.name}`))}>
                          {t.name}
                        </Item>
                      ))}
                    </Command.Group>
                  )}
                  
                  {results.users.length > 0 && (
                    <Command.Group heading="Usuarios" className="text-xs font-medium text-emerald-400/70 mb-2 px-2">
                      {results.users.map((u) => (
                        <Item key={u.id} type="user" icon={Users} onSelect={() => handleSelect(() => router.push(`/user/${u.id}`))}>
                          {u.name}
                        </Item>
                      ))}
                    </Command.Group>
                  )}
                </>
              )}
            </>
          )}

          {!loading && query.length > 1 && 
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

function Item({ children, icon: Icon, onSelect, type = 'default' }) {
  const getTypeStyles = () => {
    switch (type) {
      case 'page': // New Page Style (Purple)
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
      case 'page': return 'text-purple-400';
      case 'player': return 'text-blue-400';
      case 'team': return 'text-amber-400';
      case 'user': return 'text-emerald-400';
      default: return 'text-current';
    }
  }

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