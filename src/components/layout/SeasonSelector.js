'use client';

import { useState } from 'react';
import { ChevronDown, Calendar, Check, History, Sparkles } from 'lucide-react';
import { useSeason } from '@/contexts/SeasonContext';

export default function SeasonSelector({ className = '' }) {
  const { seasons, currentSeasonId, activeSeasonId, isCustomSeason, selectSeason } = useSeason();
  const [isOpen, setIsOpen] = useState(false);

  if (!seasons || seasons.length <= 1) {
    return null;
  }

  const currentSeason = seasons.find((s) => s.id === currentSeasonId);
  // Short display label: e.g. "2026-27" -> "26/27" or full id
  const formatShortSeason = (id) => {
    const parts = id?.split('-');
    if (parts?.length === 2 && parts[0].length === 4 && parts[1].length === 2) {
      return `${parts[0].slice(2)}/${parts[1]}`;
    }
    return id;
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="shell-action touch-target flex items-center gap-2 px-3 py-2 bg-card/40 hover:bg-white/5 border border-white/10 rounded-xl transition-all cursor-pointer group"
        aria-label={isOpen ? 'Cerrar selector de temporada' : 'Abrir selector de temporada'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10 text-primary group-hover:scale-105 transition-transform">
          {isCustomSeason ? (
            <History className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Calendar className="w-3.5 h-3.5 text-primary" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
          <span className="text-foreground">{formatShortSeason(currentSeasonId)}</span>
          {isCustomSeason ? (
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              Histórico
            </span>
          ) : (
            <span
              className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"
              title="Temporada activa"
            />
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-64 bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2 z-[70] animate-in fade-in zoom-in-95 duration-150"
            role="menu"
          >
            <div className="px-3 py-2 border-b border-white/5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Seleccionar Temporada
              </p>
              <p className="text-xs text-foreground/70 mt-0.5">
                Navega por datos de campañas anteriores
              </p>
            </div>

            <div className="py-1 space-y-1">
              {seasons.map((season) => {
                const isSelected = season.id === currentSeasonId;
                const isActiveSeason = season.id === activeSeasonId;

                return (
                  <button
                    key={season.id}
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      if (!isSelected) {
                        selectSeason(season.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all ${
                      isSelected
                        ? 'bg-primary/15 text-primary font-bold'
                        : 'hover:bg-white/5 text-foreground/80 hover:text-white'
                    }`}
                    role="menuitem"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isActiveSeason ? (
                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate flex items-center gap-1.5">
                          <span>{season.name || season.id}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {isActiveSeason ? '🟢 Temporada en curso' : '❄️ Temporada finalizada'}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {isCustomSeason && (
              <div className="pt-2 mt-1 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    selectSeason(activeSeasonId);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Volver a temporada en curso</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
