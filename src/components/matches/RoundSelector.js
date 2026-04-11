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
        'flex items-center p-1 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl shadow-black/50',
        className
      )}
    >
      {/* Prev Arrow */}
      <button
        onClick={handlePrev}
        disabled={roundIndex <= 0}
        className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="max-h-[300px] overflow-y-auto sidebar-scroll bg-zinc-950">
              <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border sticky top-0 bg-zinc-950 z-50">
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
                        ? 'bg-muted text-white font-medium'
                        : 'text-zinc-400 hover:bg-muted/50 hover:text-zinc-200'
                    )}
                  >
                    {r.round_name}
                    {r.round_id === selectedRoundId && (
                      <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--glow-primary)]" />
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
        className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        title="Next Round"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
