'use client';

import LineupPlayerCard from './LineupPlayerCard';

export default function LineupBench({ players = [], onPlayerClick, className }) {
  return (
    <div
      className={`flex-1 bg-zinc-950/40 rounded-2xl border border-white/5 p-4 backdrop-blur-sm shadow-xl overflow-hidden flex flex-col ${className || ''}`}
    >
      <div className="flex-1 overflow-hidden">
        <div className="flex flex-col items-center justify-around h-full py-2">
          {players.length > 0 ? (
            players.map((player) => (
              <div key={player.id} className="relative flex flex-col items-center group">
                <LineupPlayerCard player={player} onClick={onPlayerClick} size="medium" />
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
