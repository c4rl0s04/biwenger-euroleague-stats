'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

export default function RoundControls({ lists, selectedRoundId, onChangeRound }) {
  if (!lists?.rounds) return null;

  const currentRoundIndex = lists.rounds.findIndex(
    (r) => String(r.round_id) === String(selectedRoundId)
  );
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={handlePrev}
          className="p-3 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          disabled={isFirst}
          aria-label="Jornada anterior"
        >
          <ChevronLeft size={28} aria-hidden="true" />
        </button>
        <CustomSelect
          value={lists.rounds[currentRoundIndex]?.round_id}
          onChange={onChangeRound}
          options={lists.rounds.map((round) => ({
            value: round.round_id,
            label: (round.round_name || `Jornada ${round.round_id}`).replace(
              /\s*\(aplazada\)/i,
              ''
            ),
          }))}
          className="w-48 min-w-0"
          buttonClassName="h-11! text-base font-sans"
          placeholder="Selecciona jornada"
          label="Jornada"
          compact
        />
        <button
          type="button"
          onClick={handleNext}
          className="p-3 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-primary transition-colors disabled:opacity-20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          disabled={isLast || lists.rounds.length === 0}
          aria-label="Jornada siguiente"
        >
          <ChevronRight size={28} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
