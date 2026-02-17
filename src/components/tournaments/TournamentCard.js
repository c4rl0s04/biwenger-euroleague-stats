import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';

export default function TournamentCard({ tournament }) {
  const isActive = tournament.status === 'active';
  const data = tournament.data || {};

  // If active, try to show the current round/phase
  const statusLabel =
    isActive && data.currentPhase ? data.currentPhase : isActive ? 'En Curso' : 'Finalizado';

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={`group relative overflow-hidden rounded-2xl border bg-card/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
        isActive
          ? 'border-amber-500/20 hover:border-amber-500/40 hover:shadow-amber-500/20'
          : 'border-white/5 hover:border-white/10 hover:shadow-white/5'
      }`}
    >
      {/* Dynamic Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
          isActive
            ? 'from-amber-500/10 via-amber-500/5 to-transparent'
            : 'from-blue-500/10 via-purple-500/5 to-transparent'
        }`}
      />

      {/* Decorative localized glow */}
      <div
        className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-20 transition-all duration-500 group-hover:scale-150 ${isActive ? 'bg-amber-500' : 'bg-slate-500'}`}
      />

      <div className="relative z-10 p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div
            className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-amber-500' : 'text-slate-400'}`}
          >
            <Trophy size={32} strokeWidth={1.5} />
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-sm ${
              isActive
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}
          >
            {statusLabel}
          </span>
        </div>

        {/* Title & Info */}
        <div className="mb-6 flex-grow">
          <h3 className="text-2xl font-black font-display tracking-tight text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
            {tournament.name}
          </h3>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
            {tournament.type === 'league' ? 'Liga' : 'Eliminatoria'}
          </p>
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-white/5">
          {!isActive && data.winner ? (
            <div className="flex flex-col gap-3 mt-2">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest text-center">
                🏆 Campeón 🏆
              </span>
              <div className="flex items-center gap-4 bg-gradient-to-r from-amber-500/10 to-transparent p-3 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)] group-hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-shadow">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-lg shrink-0">
                  {data.winner.icon ? (
                    <img
                      src={`https://cdn.biwenger.com/${data.winner.icon}`}
                      alt={data.winner.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <Trophy size={20} className="text-zinc-400" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-bold text-white truncate">{data.winner.name}</span>
                  <span className="text-xs text-amber-500/80 font-medium">Ganador del Torneo</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between group/footer">
              <div className="flex items-center gap-2 text-sm text-zinc-500 transition-colors group-hover:text-zinc-400">
                <Users size={16} />
                <span>Participantes</span>
              </div>
              <div
                className={`flex items-center text-sm font-medium transition-all duration-300 transform translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 ${isActive ? 'text-amber-500' : 'text-white'}`}
              >
                Ver <ArrowRight size={16} className="ml-1" />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
