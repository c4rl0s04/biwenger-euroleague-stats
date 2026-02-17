import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';

export default function TournamentCard({ tournament }) {
  const isActive = tournament.status === 'active';
  const data = tournament.data || {};

  // Determine status label and color
  let statusLabel = isActive ? 'En Curso' : 'Finalizado';
  let statusColor = isActive
    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  // If active, try to show the current round/phase
  if (isActive && data.currentPhase) {
    statusLabel = data.currentPhase;
  }

  return (
    <Link
      href={`/tournaments/${tournament.id}`}
      className={`group relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isActive ? 'border-amber-500/30 hover:shadow-amber-500/10' : 'border-border/50'}`}
    >
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-100 ${isActive ? 'from-amber-500/5 to-transparent' : 'from-slate-500/5 to-transparent'}`}
      />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-lg ${isActive ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-800 text-slate-400'}`}
        >
          <Trophy size={24} />
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Title */}
      <div className="relative z-10 mb-4">
        <h3 className="text-xl font-bold font-display group-hover:text-primary transition-colors">
          {tournament.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {tournament.type === 'league' ? 'Liga' : 'Eliminatoria'}
        </p>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users size={16} />
          <span>Participantes</span>
        </div>
        <div className="flex items-center justify-end text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          Ver Detalles <ArrowRight size={16} className="ml-1" />
        </div>
      </div>
    </Link>
  );
}
