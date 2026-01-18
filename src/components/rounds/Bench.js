'use client';

import StandupPlayerCard from './StandupPlayerCard';
import PlayerCourtCard from './PlayerCourtCard';

export default function Bench({ players = [], viewMode = 'broadcast', onPlayerClick }) {
  if (!players || players.length === 0) return null;

  return (
    <div className="h-full py-4">
      <div className="grid grid-cols-2 gap-x-2 place-items-center h-full content-around">
        {players.map((player, index) => (
          <div
            key={player.player_id}
            className={`flex justify-center ${index === 0 ? 'col-span-2' : ''}`}
          >
            {viewMode === 'broadcast' ? (
              <StandupPlayerCard player={player} onClick={onPlayerClick} />
            ) : (
              // PlayerCourtCard expects to be absolute positioned relative to a container,
              // so we provide a container of similar size to StandupPlayerCard to keep grid consistent
              <div className="relative w-32 h-32">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <PlayerCourtCard player={player} onClick={onPlayerClick} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
