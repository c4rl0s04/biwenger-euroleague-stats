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
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 overflow-hidden text-ellipsis whitespace-nowrap">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-amber-500' : 'bg-slate-500'}`}
              />
              <span className="truncate">
                {tournament.type === 'league' ? 'Liga' : 'Eliminatoria'}
              </span>
              <span className="text-zinc-600">•</span>
              <span
                className={`truncate ${isActive ? 'text-amber-500/80 font-medium' : 'text-zinc-500'}`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Winner or Action */}
        <div className="flex items-center gap-4 shrink-0">
          {!isActive && data.winner ? (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 group-hover:border-amber-500/20 transition-colors">
              <span className="text-xs text-amber-500/80 font-medium text-right hidden md:block">
                Ganador
              </span>
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-500/50 shadow-sm">
                  {data.winner.icon ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                      <Trophy size={14} className="text-zinc-400" />
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-white max-w-[100px] truncate">
                  {data.winner.name}
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-white/5 text-zinc-400 border-white/5'
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
