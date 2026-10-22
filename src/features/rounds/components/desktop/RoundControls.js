'use client';

import { useId } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge, IconButton } from '@/components/ui/foundation';

export default function RoundControls({ lists, selectedRoundId, onChangeRound }) {
  const selectId = useId();
  if (!lists?.rounds) return null;

  const currentRoundIndex = lists.rounds.findIndex(
    (r) => String(r.round_id) === String(selectedRoundId)
  );
  const status = lists.rounds[currentRoundIndex]?.status;
  const isFirst = currentRoundIndex <= 0;
  const isLast = currentRoundIndex >= lists.rounds.length - 1;

  const handlePrev = () => {
    if (isFirst || currentRoundIndex === -1) return;
    const prevRound = lists.rounds[currentRoundIndex - 1];
    if (prevRound) onChangeRound(prevRound.round_id);
  };

  const handleNext = () => {
    if (isLast) return;
    const nextRound =
      currentRoundIndex === -1 ? lists.rounds[0] : lists.rounds[currentRoundIndex + 1];
    if (nextRound) onChangeRound(nextRound.round_id);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Round Selector */}
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <label htmlFor={selectId} className="sr-only">
          Jornada
        </label>
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirst}
            aria-label="Jornada anterior"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </IconButton>

          <select
            id={selectId}
            value={selectedRoundId ?? ''}
            onChange={(event) => {
              const round = lists.rounds.find(
                (entry) => String(entry.round_id) === event.target.value
              );
              if (round) onChangeRound(round.round_id);
            }}
            className="h-11 min-w-0 max-w-56 rounded-[var(--radius-control)] border border-[hsl(var(--control-border))] bg-[hsl(var(--control-surface))] px-3 font-sans text-base font-semibold text-[hsl(var(--control-content))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))]"
          >
            <option value="" disabled>
              Selecciona jornada
            </option>
            {lists.rounds.map((round) => (
              <option key={round.round_id} value={round.round_id}>
                {(round.round_name || `Jornada ${round.round_id}`).replace(/\s*\(aplazada\)/i, '')}
              </option>
            ))}
          </select>

          <IconButton
            variant="ghost"
            onClick={handleNext}
            disabled={isLast || lists.rounds.length === 0}
            aria-label="Jornada siguiente"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </IconButton>
        </div>
      </div>
      {status && (
        <Badge variant={status === 'live' ? 'accent' : 'neutral'}>
          {status === 'live' ? 'En directo' : status === 'finished' ? 'Finalizada' : 'Próximamente'}
        </Badge>
      )}
    </div>
  );
}
