'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

export default function RoundControls({ lists, selectedRoundId, onChangeRound, lineupSummary }) {
  if (!lists?.rounds) return null;

  const currentRoundIndex = lists.rounds.findIndex((r) => r.round_id === selectedRoundId);
  const isFirst = currentRoundIndex === 0;
  const isLast = currentRoundIndex === lists.rounds.length - 1;

  const handlePrev = () => {
    if (isLast) return;
    const nextRound = lists.rounds[currentRoundIndex + 1];
    onChangeRound(nextRound.round_id);
  };

  const handleNext = () => {
    if (isFirst) return;
    const nextRound = lists.rounds[currentRoundIndex - 1];
    onChangeRound(nextRound.round_id);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Round Selector */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrev}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          disabled={isLast}
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-center min-w-[200px]">
          <CustomSelect
            value={selectedRoundId}
            onChange={onChangeRound}
            options={
              lists.rounds.map((r) => ({ value: r.round_id, label: r.round_name })).reverse() || []
            }
            className="w-[350px] mx-auto"
            buttonClassName="h-16 text-4xl font-bold font-display justify-center bg-transparent border-none hover:bg-white/10"
            placeholder="Selecciona Jornada"
          />
          <div className="text-sm text-muted-foreground -mt-1">
            {lineupSummary ? (
              <>
                <span className="text-primary font-bold">{lineupSummary.total_points} pts</span>
                <span className="mx-2">•</span>
                <span>Posición {lineupSummary.round_rank}</span>
              </>
            ) : (
              'Sin participación'
            )}
          </div>
        </div>

        <button
          onClick={handleNext}
          className="p-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
          disabled={isFirst}
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}
