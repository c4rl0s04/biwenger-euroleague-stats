import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { Section } from '@/components/layout';
import { getTournamentDetails, getStandings, getFixtures } from '@/lib/services/tournamentService';
import { StandingsTable, TournamentFixtures } from '@/components/tournaments';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TournamentDetailsPage({ params }) {
  const { id } = await params;
  const tournament = await getTournamentDetails(id);

  if (!tournament) {
    notFound();
  }

  const standings = await getStandings(id);
  const fixtures = await getFixtures(id);

  const isActive = tournament.status === 'active';
  const data = tournament.data || {};

  return (
    <div className="space-y-6">
      <PageHeader
        title={tournament.name}
        description={
          tournament.type === 'league'
            ? 'Liga - Fase de grupos y clasificación'
            : 'Eliminatoria - Cuadro de enfrentamientos'
        }
        backHref="/tournaments"
      >
        <div className="flex items-center gap-3 mt-4">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              isActive
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}
          >
            {isActive ? 'En Curso' : 'Finalizado'}
          </span>
          {data.currentPhase && (
            <span className="px-3 py-1 rounded-full text-xs font-medium border border-border/50 bg-secondary/50 text-muted-foreground">
              {data.currentPhase}
            </span>
          )}
        </div>
      </PageHeader>

      {/* Winner Banner (if finished) */}
      {!isActive && data.winner && (
        <Section title="Ganador del Torneo" background="section-raised" delay={0}>
          <div className="flex items-center gap-6 p-6 rounded-xl bg-gradient-to-br from-amber-500/20 to-transparent border border-amber-500/30">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              {data.winner.icon ? (
                <img
                  src={`https://biwenger.as.com/api/v2${data.winner.icon}`}
                  alt={data.winner.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-amber-500/20 flex items-center justify-center">
                  <Trophy size={40} className="text-amber-500" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-amber-500 mb-1">
                {data.winner.name}
              </h3>
              <p className="text-amber-500/80">Campeón de {tournament.name}</p>
            </div>
            <Trophy size={64} className="ml-auto text-amber-500/20" />
          </div>
        </Section>
      )}

      {/* Content based on type */}
      {tournament.type === 'league' ? (
        <Section title="Clasificación" delay={100}>
          <StandingsTable standings={standings} />
        </Section>
      ) : (
        <Section title="Cuadro" delay={100}>
          <div className="p-4 rounded-xl border border-border/50 bg-card/50">
            <p>Cuadro de eliminatorias aquí</p>
          </div>
        </Section>
      )}

      <Section title="Resultados" delay={200}>
        <TournamentFixtures fixtures={fixtures} />
      </Section>
    </div>
  );
}
