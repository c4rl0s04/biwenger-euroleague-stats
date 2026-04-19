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
          className="p-3 rounded-full hover:bg-secondary/50 text-zinc-400 hover:text-primary transition-all disabled:opacity-20 cursor-pointer"
          disabled={isLast}
        >
          <ChevronLeft size={28} />
        </button>

        <div className="text-center">
          <CustomSelect
            value={selectedRoundId}
            onChange={onChangeRound}
            options={
              lists.rounds
                .map((r) => ({
                  value: r.round_id,
                  label: (r.round_name || `Jornada ${r.round_id}`).replace(/\s*\(aplazada\)/i, ''),
                }))
                .reverse() || []
            }
            className="w-fit mx-auto"
            buttonClassName="h-16 text-5xl md:text-6xl font-black font-display justify-center bg-transparent border-none hover:text-primary transition-all cursor-pointer px-6"
            placeholder="Selecciona Jornada"
          />
          {/* Points display moved to Sidebar ScoreOverviewCard */}
        </div>

        <button
          onClick={handleNext}
          className="p-3 rounded-full hover:bg-secondary/50 text-zinc-400 hover:text-primary transition-all disabled:opacity-20 cursor-pointer"
          disabled={isFirst}
        >
          <ChevronRight size={28} />
        </button>
      </div>
    </div>
  );
}
