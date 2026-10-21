'use client';

import LineupPlayerCard from './LineupPlayerCard';
import { LineupSlotPlaceholder } from '@/features/lineup/public';

export default function LineupBench({ players = [], onSlotClick, className }) {
  return (
    <div
      className={`flex-1 bg-zinc-950/40 rounded-2xl border border-white/5 p-3 sm:p-4 backdrop-blur-sm shadow-xl overflow-hidden flex flex-col ${className || ''}`}
    >
      <div className="flex-1 overflow-hidden">
        <div className="flex h-full items-center gap-4 overflow-x-auto py-2 lg:flex-col lg:justify-around lg:overflow-x-hidden">
          {players.length > 0 ? (
            players.map((slot) => (
              <div
                key={slot.slotIndex}
                className="group relative flex shrink-0 flex-col items-center"
              >
                {slot.player ? (
                  <LineupPlayerCard
                    player={slot.player}
                    onClick={() => onSlotClick(slot)}
                    size="medium"
                  />
                ) : (
                  <LineupSlotPlaceholder slot={slot} onSelect={onSlotClick} />
                )}
              </div>
            ))
          ) : (
            <div className="text-zinc-600 text-sm italic">No hay jugadores seleccionados</div>
          )}
        </div>
      </div>
    </div>
  );
}
