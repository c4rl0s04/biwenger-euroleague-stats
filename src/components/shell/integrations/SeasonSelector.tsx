'use client';

import { useState } from 'react';
import { ChevronDown, Calendar, Check, History, Sparkles } from 'lucide-react';
import { useSeason } from '@/contexts/SeasonContext';

export interface SeasonSelectorProps {
  className?: string;
  menuAlign?: 'left' | 'right';
}

export function SeasonSelector({ className = '', menuAlign = 'right' }: SeasonSelectorProps) {
  const { seasons, currentSeasonId, activeSeasonId, isCustomSeason, selectSeason } = useSeason();
  const [isOpen, setIsOpen] = useState(false);

  if (!seasons || seasons.length <= 1) {
    return null;
  }

  const formatShortSeason = (id?: string) => {
    const parts = id?.split('-');
    if (parts?.length === 2 && parts[0].length === 4 && parts[1].length === 2) {
      return `${parts[0].slice(2)}/${parts[1]}`;
    }
    return id || '';
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="shell-action touch-target flex items-center gap-2 px-3 py-2 bg-surface-card/60 hover:bg-surface-secondary border border-border-default/60 rounded-xl transition-all cursor-pointer group"
        aria-label={isOpen ? 'Cerrar selector de temporada' : 'Abrir selector de temporada'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-action-primary/10 text-action-primary group-hover:scale-105 transition-transform">
          {isCustomSeason ? (
            <History className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Calendar className="w-3.5 h-3.5 text-action-primary" />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-tight">
          <span className="text-content-primary">{formatShortSeason(currentSeasonId)}</span>
          {isCustomSeason ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
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
          className={`w-3.5 h-3.5 text-content-muted transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div
            className={`absolute z-[70] mt-2 rounded-2xl border border-border-default bg-surface-card p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
              menuAlign === 'left' ? 'left-0 w-[min(16rem,calc(100vw-7rem))]' : 'right-0 w-64'
            }`}
            role="menu"
          >
            <div className="px-3 py-2 border-b border-border-default/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-content-muted">
                Seleccionar Temporada
              </p>
              <p className="text-xs text-content-muted mt-0.5">
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
                        ? 'bg-action-primary/15 text-action-primary font-bold'
                        : 'hover:bg-surface-secondary text-content-primary'
                    }`}
                    role="menuitem"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      {isActiveSeason ? (
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-emerald-400" />
                      ) : (
                        <div className="h-2 w-2 flex-shrink-0 rounded-full bg-slate-500" />
                      )}
                      <span className="truncate text-xs font-medium">
                        {season.name || season.id}
                      </span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-action-primary flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            {isCustomSeason && (
              <div className="pt-2 mt-1 border-t border-border-default/40">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    selectSeason(activeSeasonId);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-semibold text-action-primary hover:bg-action-primary/10 rounded-lg transition-colors cursor-pointer"
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

export default SeasonSelector;
