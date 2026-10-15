'use client';

import { createPortal } from 'react-dom';
import { useId } from 'react';
import { ModalDialog, Button } from '@/components/ui/foundation';
import { useRouter } from 'next/navigation';
import { X, CheckCircle2, Trophy } from 'lucide-react';

// Position display config — blue / green / red
const POSITION_CONFIG = {
  Base: {
    label: 'B',
    badge: 'bg-blue-400/10 border-blue-400/20',
  },
  Alero: {
    label: 'A',
    badge: 'bg-green-400/10 border-green-400/20',
  },
  Pivot: {
    label: 'P',
    badge: 'bg-red-400/10 border-red-400/20',
  },
};

function PlayerRow({ player, index, isCaptain, isStarter, onPlayerClick }) {
  const pos = player.normPos || 'Base';
  const config = POSITION_CONFIG[pos] || POSITION_CONFIG.Base;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-1 rounded-xl border transition-colors ${
        isCaptain
          ? 'bg-yellow-500/5 border-yellow-500/20'
          : isStarter
            ? 'bg-secondary/50 border-border/50'
            : 'bg-transparent border-transparent'
      }`}
    >
      {/* Row number */}
      <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0 text-center">
        {index + 1}
      </span>

      {/* Position badge */}
      <span
        title={pos}
        className={`text-[10px] text-content-primary font-semibold px-1.5 py-0.5 rounded border shrink-0 ${config.badge}`}
      >
        {config.label}
      </span>

      {/* Player name — clickable */}
      <button
        onClick={() => onPlayerClick(player.id)}
        className={`flex-1 min-w-0 min-h-11 text-sm font-semibold truncate text-left hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring cursor-pointer ${
          isCaptain ? 'text-action-primary' : 'text-foreground'
        }`}
      >
        {player.name}
      </button>

      {/* Captain trophy */}
      {isCaptain && (
        <div className="flex items-center gap-1 shrink-0">
          <Trophy size={12} className="text-action-primary" aria-hidden="true" />
          <span className="text-[10px] font-semibold text-action-primary">Cap</span>
        </div>
      )}

      {/* Bench label */}
      {!isStarter && (
        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest shrink-0">
          SUP
        </span>
      )}
    </div>
  );
}

export default function LineupModal({
  isOpen,
  onClose,
  starters,
  bench,
  captain,
  formationType,
  userName,
  returnFocusRef,
}) {
  const router = useRouter();
  const titleId = useId();

  const handlePlayerClick = (playerId) => {
    onClose();
    router.push(`/player/${playerId}`);
  };
  if (!isOpen || typeof document === 'undefined') return null;
  return createPortal(
    <div className="schedule-lineup-overlay">
      <button
        type="button"
        className="schedule-lineup-backdrop"
        onClick={onClose}
        aria-label="Cerrar resumen de alineación"
        tabIndex={-1}
      />
      <ModalDialog
        onClose={onClose}
        aria-labelledby={titleId}
        preventInitialFocusScroll
        returnFocusRef={returnFocusRef}
        className="schedule-lineup-dialog"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-4 border-b border-border">
          <div className="flex min-w-0 items-center gap-2.5">
            <CheckCircle2 size={16} className="text-green-400 shrink-0" />
            <div className="min-w-0">
              <h2 id={titleId} className="text-base font-bold text-foreground mb-1">
                Alineación enviada
              </h2>
              <p className="text-xs text-muted-foreground break-words">
                {userName ? `${userName} · ` : ''}Esquema {formationType}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar alineación"
            className="flex shrink-0 items-center justify-center size-11 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="schedule-lineup-player-list">
          {/* Starters */}
          <div className="px-3 pt-3 pb-1">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">
              Quinteto Inicial
            </p>
            <div className="space-y-1">
              {starters.map((player, i) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={i}
                  isCaptain={player.id === captain?.id}
                  isStarter
                  onPlayerClick={handlePlayerClick}
                />
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 my-2 border-t border-border" />

          {/* Bench */}
          <div className="px-3 pb-3">
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] px-1 mb-2">
              Banquillo
            </p>
            <div className="space-y-1">
              {bench.map((player, i) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  index={i}
                  isCaptain={false}
                  isStarter={false}
                  onPlayerClick={handlePlayerClick}
                />
              ))}
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="shrink-0 border-t border-border p-4">
          <Button onClick={onClose} variant="secondary" className="w-full min-h-11">
            Cerrar
          </Button>
        </div>
      </ModalDialog>
    </div>,
    document.body
  );
}
