'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

export function RoundSelector({ rounds, selectedRoundId, onRoundChange, className }) {
  const activeRound = rounds.find((r) => r.round_id === selectedRoundId);
  const roundIndex = rounds.findIndex((r) => r.round_id === selectedRoundId);

  const handlePrev = () => {
    if (roundIndex > 0) onRoundChange(rounds[roundIndex - 1].round_id);
  };

  const handleNext = () => {
    if (roundIndex < rounds.length - 1) onRoundChange(rounds[roundIndex + 1].round_id);
  };

  if (!activeRound) return null;

  return (
    <div
      className={cn(
        'flex items-center p-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50 w-full max-w-md mx-auto',
        className
      )}
    >
      {/* Prev Arrow */}
      <button
        onClick={handlePrev}
        disabled={roundIndex <= 0}
        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        title="Previous Round"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Dropdown in the middle */}
      <div className="flex-1">
        <Dropdown
          icon={<Calendar size={16} />}
          label={activeRound.round_name}
          align="center"
          fullWidth
        >
          {(close) => (
            <div className="max-h-[300px] overflow-y-auto sidebar-scroll">
              <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 sticky top-0 bg-zinc-950 z-50">
                Jornadas
              </div>
              <div className="p-1">
                {rounds.map((r) => (
                  <button
                    key={r.round_id}
                    onClick={() => {
                      onRoundChange(r.round_id);
                      close();
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-md flex items-center justify-between transition-colors my-0.5 cursor-pointer',
                      r.round_id === selectedRoundId
                        ? 'bg-zinc-800 text-white font-medium'
                        : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                    )}
                  >
                    {r.round_name}
                    {r.round_id === selectedRoundId && (
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </Dropdown>
      </div>

      {/* Next Arrow */}
      <button
        onClick={handleNext}
        disabled={roundIndex >= rounds.length - 1}
        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next Round"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
