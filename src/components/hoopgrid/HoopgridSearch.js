'use client';

import { useState, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, X, User } from 'lucide-react';
import { motion } from 'framer-motion';
import PlayerImage from '@/components/ui/PlayerImage';
import { apiClient } from '@/lib/api-client';

export default function HoopgridSearch({ onClose, onSelect, title }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failedPlayers, setFailedPlayers] = useState(new Set());
  const [validating, setValidating] = useState(false);
  const inputRef = useRef(null);

  const handleSelect = async (player) => {
    if (failedPlayers.has(player.id) || validating) return;

    setValidating(true);
    const isCorrect = await onSelect(player);
    setValidating(false);

    if (!isCorrect) {
      setFailedPlayers((prev) => new Set(prev).add(player.id));
    }
  };

  // Focus input immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Fetch players (Debounced)
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(res.data?.players?.slice(0, 10) || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-xl"
      >
        <Command
          className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden glass-panel"
          shouldFilter={false} // We filter on server
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              onClose();
            }
          }}
        >
          {/* Header & Input */}
          <div className="flex items-center border-b border-border px-4 py-1" cmdk-input-wrapper="">
            <Search className="w-5 h-5 text-muted-foreground mr-3" />
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Escribe el nombre del jugador..."
              className="flex-1 h-14 bg-transparent outline-none text-foreground placeholder:text-muted-foreground text-lg"
            />
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-2 bg-muted/20 border-b border-border">
            <p className="text-[10px] uppercase font-bold tracking-widest text-primary px-2">
              Objetivo: {title}
            </p>
          </div>

          {/* Results List */}
          <Command.List className="max-h-[45vh] overflow-y-auto p-2 scrollbar-hide">
            {loading && (
              <Command.Loading className="p-8 text-center text-muted-foreground animate-pulse font-display uppercase tracking-widest">
                Buscando...
              </Command.Loading>
            )}

            {!loading && results.length > 0 && (
              <Command.Group
                heading="Resultados"
                className="text-[10px] font-bold text-muted-foreground px-2 py-2 uppercase"
              >
                {results.map((player) => {
                  const isFailed = failedPlayers.has(player.id);
                  return (
                    <Command.Item
                      key={player.id}
                      value={player.name}
                      onSelect={() => handleSelect(player)}
                      disabled={isFailed || validating}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer text-sm transition-colors group ${
                        isFailed
                          ? 'bg-destructive/10 text-destructive pointer-events-none'
                          : 'aria-selected:bg-primary/10 aria-selected:text-primary text-muted-foreground'
                      }`}
                    >
                      <PlayerImage
                        src={player.img}
                        alt={player.name}
                        width={40}
                        height={40}
                        className={`w-10 h-10 rounded-full shrink-0 object-cover object-top ${isFailed ? 'opacity-50 grayscale' : 'bg-muted'}`}
                      />
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <span
                          className={`font-bold truncate ${isFailed ? 'text-destructive' : 'text-foreground group-aria-selected:text-primary'}`}
                        >
                          {player.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-widest truncate mt-0.5 ${isFailed ? 'text-destructive/70' : 'opacity-60'}`}
                        >
                          {player.team}
                        </span>
                      </div>
                      <div
                        className={`text-[10px] font-black uppercase tracking-tighter shrink-0 pl-2 ${isFailed ? 'text-destructive opacity-100' : 'opacity-0 group-aria-selected:opacity-100'}`}
                      >
                        {isFailed ? '✗ ERROR' : '⏎'}
                      </div>
                    </Command.Item>
                  );
                })}
              </Command.Group>
            )}

            {!loading && query.length > 1 && results.length === 0 && (
              <div className="py-12 text-center text-muted-foreground font-display text-sm uppercase">
                No se han encontrado jugadores.
              </div>
            )}

            {query.length <= 1 && (
              <div className="py-12 text-center text-muted-foreground font-display text-sm uppercase opacity-40">
                Escribe 2 letras para empezar...
              </div>
            )}
          </Command.List>

          {/* Footer Footer */}
          <div className="flex items-center justify-between p-3 border-t border-border bg-muted/30">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground">
                  ↑↓
                </kbd>{' '}
                Navegar
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-foreground">
                  Enter
                </kbd>{' '}
                Elegir
              </div>
            </div>
            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">
              Euroleague Stats
            </div>
          </div>
        </Command>
      </motion.div>
    </div>
  );
}
