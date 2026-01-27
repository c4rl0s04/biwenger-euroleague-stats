import Image from 'next/image';
import { UserX } from 'lucide-react';

export default function GradaList({ players }) {
  if (!players || players.length === 0) return null;

  // Sort by points descending to highlight mistakes
  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-zinc-400 px-2">
        <UserX size={14} />
        <span className="text-xs font-medium uppercase tracking-wider">No Convocados (Grada)</span>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((player) => (
          <div
            key={player.id}
            className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Image */}
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800">
                {player.img ? (
                  <Image
                    src={player.img}
                    alt={player.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <UserX size={14} className="m-auto mt-2 text-zinc-600" />
                )}
              </div>

              {/* Name & Team */}
              <div>
                <div className="text-sm font-medium text-zinc-200">{player.name}</div>
                <div className="text-[10px] text-zinc-500">
                  {player.team_short} · {player.position}
                </div>
              </div>
            </div>

            {/* Points */}
            <div className="text-right">
              <span
                className={`text-sm font-bold ${player.points > 15 ? 'text-red-400' : 'text-zinc-500'}`}
              >
                {player.points}
              </span>
              <span className="text-[10px] text-zinc-600 block -mt-1">pts</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
