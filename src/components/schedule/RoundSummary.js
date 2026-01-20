export default function RoundSummary({ players = [] }) {
  if (players.length === 0) return null;

  // Calculate total points
  const totalPoints = players.reduce((sum, p) => sum + (p.puntos || 0), 0);

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Resumen</span>
      </div>

      <div className="relative z-20 flex-1 p-4 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50 flex items-center justify-around min-h-[88px]">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-white">{players.length}</span>
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Jugadores
          </span>
        </div>
        <div className="w-px h-10 bg-white/10"></div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-bold text-indigo-400">{totalPoints}</span>
          <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            Puntos
          </span>
        </div>
      </div>
    </div>
  );
}
