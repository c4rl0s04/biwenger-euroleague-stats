import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { UserX } from 'lucide-react';

export default function GradaList({ players }) {
  const router = useRouter();

  if (!players || players.length === 0) return null;

  // Sort by points descending to highlight mistakes
  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        {sorted.map((player) => {
          return (
            <div
              key={player.id}
              onClick={() => router.push(`/player/${player.player_id || player.id}`)}
              className="group flex items-center justify-between p-1.5 rounded-lg bg-zinc-900/50 border border-white/5 hover:bg-zinc-800/50 transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Image */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 group-hover:scale-105 transition-transform duration-200">
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
                  <div className="text-sm font-medium text-zinc-200 truncate max-w-[120px] group-hover:text-white transition-colors duration-200">
                    {player.name}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {player.team_short} · {player.position}
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <span
                  className={`text-sm font-bold ${player.points > 15 ? 'text-red-400' : 'text-zinc-500'} group-hover:text-white transition-colors duration-200`}
                >
                  {player.points}
                </span>
                <span className="text-[10px] text-zinc-600 block -mt-1 group-hover:text-zinc-400">
                  pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
