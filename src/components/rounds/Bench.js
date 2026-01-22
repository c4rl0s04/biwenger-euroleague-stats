'use client';

import PlayerCourtCard from './PlayerCourtCard';

export default function Bench({ players = [], onPlayerClick }) {
  if (!players || players.length === 0) return null;

  return (
    // Changed py-4 to py-2 to reduce outer spacing
    <div className="w-full py-2">
      <div className="w-full px-4">
        {/* Changed pt-8 -> pt-2 
           This significantly pulls the players up closer to the title.
           We keep pb-12 to ensure the '6th Man' badge doesn't get cut off.
        */}
        <div className="flex items-center justify-around gap-2 pt-2 pb-12 w-full">
          {players.map((player) => (
            <div key={player.player_id} className="relative flex flex-col items-center group">
              {/* Player Card */}
              <div className="transition-transform duration-200 hover:scale-110 hover:-translate-y-2 cursor-pointer z-10">
                <PlayerCourtCard player={player} onClick={onPlayerClick} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
