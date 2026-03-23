import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui';
import { Section } from '@/components/layout';
import { getTournamentDetails, getStandings, getFixtures } from '@/lib/services/tournamentService';
import { StandingsTable, TournamentFixtures, TournamentBracket } from '@/components/tournaments';
import { Trophy } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

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
    <div>
      <PageHeader
        title={tournament.name}
        description={
          tournament.type === 'league'
            ? 'Liga - Fase de grupos y clasificación'
            : 'Eliminatoria - Cuadro de enfrentamientos'
        }
        className="!pb-0"
      />

      {/* Winner Banner (if finished) */}
      {!isActive && data.winner && (
        <Section title="Ganador del Torneo" background="section-raised" delay={0}>
          <ElegantCard hideHeader color="amber" bgColor="amber" className="w-full" padding="p-6">
            <div className="flex items-center gap-8 py-2">
              <Link
                href={`/user/${data.winner.id || data.winner.name}`}
                className="relative group/winner block transition-transform duration-500 hover:scale-105 active:scale-95"
              >
                <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl opacity-0 group-hover/winner:opacity-100 transition-opacity duration-700" />
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
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
                    <div className="w-full h-full bg-amber-500/10 flex items-center justify-center">
                      <Trophy size={48} className="text-amber-500" />
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={20} className="text-amber-400" />
                  <span className="text-xs font-black text-amber-500 uppercase tracking-[0.3em] font-sans">
                    Campeón
                  </span>
                </div>
                <Link href={`/user/${data.winner.id || data.winner.name}`}>
                  <h3 className="text-4xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 uppercase italic tracking-tighter leading-none mb-1 hover:brightness-110 transition-all">
                    {data.winner.name}
                  </h3>
                </Link>
                <p className="text-xl font-bold text-amber-500/80 font-display uppercase tracking-widest">
                  Campeón de {tournament.name}
                </p>
              </div>
            </div>
          </ElegantCard>
        </Section>
      )}

      {/* Content based on type */}
      {tournament.type === 'league' ? (
        <Section title="Clasificación" delay={100} background="section-base">
          <StandingsTable standings={standings} />
        </Section>
      ) : (
        <Section title="Cuadro" delay={100} background="section-base">
          <TournamentBracket fixtures={fixtures} />
        </Section>
      )}

      <Section title="Resultados" delay={200} background="section-raised">
        <TournamentFixtures fixtures={fixtures} />
      </Section>
    </div>
  );
}
