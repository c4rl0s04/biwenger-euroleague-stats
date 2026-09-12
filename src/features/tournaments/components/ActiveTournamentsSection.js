import TournamentRow from './TournamentRow';

export default function ActiveTournamentsSection({ tournaments }) {
  if (!tournaments || tournaments.length === 0) {
    return (
      <div className="text-center py-8 p-4 rounded-xl border border-dashed border-border/50 bg-secondary/20">
        <p className="text-muted-foreground">No hay torneos activos en este momento.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tournaments.map((tournament) => (
        <TournamentRow key={tournament.id} tournament={tournament} />
      ))}
    </div>
  );
}
