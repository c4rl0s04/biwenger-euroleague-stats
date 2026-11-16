import Image from 'next/image';
import { UserX } from 'lucide-react';

export default function GradaList({ players }) {
  if (!players || players.length === 0) return null;

  // Sort by points descending to highlight mistakes
  const sorted = [...players].sort((a, b) => b.points - a.points);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
        {sorted.map((player) => {
          return (
            <a
              key={player.player_id ?? player.id}
              href={`/player/${player.player_id || player.id}`}
              className="group flex items-center justify-between p-1.5 rounded-lg bg-secondary/50 border border-border hover:bg-secondary transition-colors duration-200 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {/* Image */}
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary shrink-0 group-hover:scale-105 transition-transform duration-200">
                  {player.img ? (
                    <Image
                      src={player.img}
                      alt={player.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  ) : (
                    <UserX size={14} className="m-auto mt-2 text-muted-foreground" />
                  )}
                </div>

                {/* Name & Team */}
                <div>
                  <div className="text-sm font-medium text-foreground truncate max-w-[120px] group-hover:text-foreground transition-colors duration-200">
                    {player.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {player.team_short} · {player.position}
                  </div>
                </div>
              </div>

              {/* Points */}
              <div className="text-right shrink-0">
                <span
                  className={`text-base font-black font-mono ${player.points > 15 ? 'text-[var(--round-danger)]' : 'text-muted-foreground'} group-hover:text-foreground transition-colors duration-200`}
                >
                  {player.points ?? '/'}
                </span>
                <span className="text-[9px] text-muted-foreground font-bold uppercase block -mt-1 tracking-tighter group-hover:text-muted-foreground">
                  PTS
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
