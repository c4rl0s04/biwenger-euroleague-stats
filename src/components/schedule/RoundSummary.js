import { getColorForUser } from '@/lib/constants/colors';

export default function RoundSummary({ players = [], activeUserId, colorIndex }) {
  if (players.length === 0) return null;

  // Calculate total points
  const totalPoints = players.reduce((sum, p) => sum + (p.puntos || 0), 0);

  // Theme color for the active manager - now using the proper DB index
  const activeColor = activeUserId
    ? getColorForUser(activeUserId, null, colorIndex)
    : { text: 'text-primary' };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
          Resumen
        </span>
      </div>

      <div className="relative z-20 flex-1 p-4 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl shadow-black/50 flex items-center justify-around min-h-[88px]">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black text-white">{players.length}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
            Jugadores
          </span>
        </div>

        <div className="w-px h-10 bg-white/10"></div>

        <div className="flex flex-col items-center">
          <span className={`text-3xl font-black ${activeColor.text}`}>{totalPoints}</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
            Puntos
          </span>
        </div>
      </div>
    </div>
  );
}
