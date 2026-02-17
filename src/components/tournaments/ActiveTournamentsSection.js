import TournamentCard from './TournamentCard';

export default function ActiveTournamentsSection({ tournaments }) {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-8 p-4 rounded-xl border border-dashed border-border/50 bg-secondary/20">
        <p className="text-muted-foreground">No hay torneos activos en este momento.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {tournaments.map((tournament) => (
        <TournamentCard key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
