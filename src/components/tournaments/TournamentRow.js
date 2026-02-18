import Link from 'next/link';
import { Trophy, Users, ArrowRight } from 'lucide-react';

export default function TournamentRow({ tournament }) {
  const isActive = tournament.status === 'active';
  const data = tournament.data || {};

  // If active, try to show the current round/phase
  const statusLabel =
    isActive && data.currentPhase ? data.currentPhase : isActive ? 'En Curso' : 'Finalizado';

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={`group relative overflow-hidden rounded-xl border bg-card/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${
        isActive
          ? 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/10'
          : 'border-white/5 hover:border-white/10 hover:shadow-white/5'
      }`}
    >
      {/* Dynamic Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
          isActive
            ? 'from-amber-500/10 via-amber-500/5 to-transparent'
            : 'from-blue-500/10 via-purple-500/5 to-transparent'
        }`}
      />

      <div className="relative z-10 p-4 flex items-center justify-between gap-4">
        {/* Left Side: Icon & Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div
            className={`p-3 rounded-lg border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 ${
              isActive
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-zinc-800/50 text-slate-400 border-white/5'
            }`}
          >
            <Trophy size={24} strokeWidth={1.5} />
          </div>

          <div className="flex flex-row items-center gap-3 min-w-0">
            <h3 className="text-lg font-black font-display tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all truncate shrink-0 max-w-[50%]">
              {tournament.name}
            </h3>
            <div className="flex items-center gap-2 text-xs shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {/* Type Badge - Minimal */}
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  tournament.type === 'league' ? 'text-blue-400' : 'text-purple-400'
                }`}
              >
                {tournament.type === 'league' ? 'Liga' : 'Eliminatoria'}
              </span>

              <span className="text-zinc-600">•</span>

              {/* Status Badge - Minimal */}
              <span
                className={`text-[10px] uppercase font-bold tracking-wider truncate ${
                  isActive ? 'text-amber-500' : 'text-zinc-500'
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Winner or Action */}
        <div className="flex items-center gap-4 shrink-0">
          {!isActive && data.winner ? (
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col items-end mr-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/90 mb-0.5">
                  Ganador
                </span>
                <span className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 max-w-[150px] truncate leading-none">
                  {data.winner.name}
                </span>
              </div>
              <div className="relative group/winner">
                <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-md opacity-0 group-hover/winner:opacity-100 transition-opacity duration-500" />
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50 shadow-lg shadow-amber-900/20 group-hover/winner:border-amber-400 transition-colors">
                  {data.winner.icon ? (
                    <img
                      src={
                        data.winner.icon.startsWith('http')
                          ? data.winner.icon
                          : `https://cdn.biwenger.com/${data.winner.icon}`
                      }
                      alt={data.winner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Trophy size={16} className="text-amber-500" />
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm border border-amber-400">
                  <Trophy size={8} fill="currentColor" />
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`hidden sm:flex items-center gap-2 text-xs font-medium transition-colors ${
                isActive
                  ? 'text-amber-400/80 group-hover:text-amber-400'
                  : 'text-zinc-500 group-hover:text-zinc-300'
              }`}
            >
              <Users size={14} />
              <span>Ver detalles</span>
            </div>
          )}

          <ArrowRight
            size={18}
            className={`transition-transform duration-300 group-hover:translate-x-1 ${
              isActive ? 'text-amber-500' : 'text-zinc-600 group-hover:text-white'
            }`}
          />
        </div>
      </div>
    </Link>
  );
}
