import { auth } from '@/auth';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  getLeagueDashboardData,
  getNextRoundData,
  getUserDashboardData,
} from '@/lib/services';

type PageProps = { params: Promise<{ section: string }> };
type RecordValue = Record<string, any>;

const numeric = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const playerName = (player: RecordValue) =>
  String(player.name ?? player.player_name ?? 'Jugador');

export default async function DashboardSectionPage({ params }: PageProps) {
  const { section } = await params;
  const pathname = `/dashboard/${section}`;
  const route = await requireMobileRoute(pathname);
  const session = await auth();
  const userId = session?.user?.id;

  let content;

  if (section === 'season') {
    const dashboard = userId ? await getUserDashboardData(userId) : ({} as RecordValue);
    const stats = (dashboard as RecordValue).seasonStats ?? {};
    const captain = (dashboard as RecordValue).captainStats ?? {};
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric label="Posición" value={numeric(stats.position) ? `#${stats.position}` : '—'} tone="accent" />
          <MobileMetric label="Puntos" value={numeric(stats.total_points).toLocaleString('es-ES')} />
          <MobileMetric label="Media" value={numeric(stats.average_points).toLocaleString('es-ES')} detail="por jornada" />
          <MobileMetric label="Podios" value={numeric(stats.podiums)} tone="positive" />
        </MobileMetricGrid>
        <MobileSectionHeading>Capitanes</MobileSectionHeading>
        <MobileListRow title="Puntos como capitán" trailing={numeric(captain.captain_points ?? captain.total_points)} />
        <MobileListRow title="Acierto medio" trailing={`${numeric(captain.success_rate ?? captain.average).toLocaleString('es-ES')}%`} />
      </>
    );
  } else if (section === 'comparison') {
    const dashboard = userId ? await getUserDashboardData(userId) : ({} as RecordValue);
    const gap = (dashboard as RecordValue).leaderGap ?? {};
    const homeAway = (dashboard as RecordValue).homeAwayStats ?? {};
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric label="Tus puntos" value={numeric(gap.user_points).toLocaleString('es-ES')} />
          <MobileMetric label={gap.is_leader ? 'Ventaja' : 'Distancia'} value={`${gap.is_leader ? '+' : '-'}${numeric(gap.gap_to_second ?? gap.gap)}`} tone={gap.is_leader ? 'positive' : 'negative'} />
          <MobileMetric label="Media casa" value={numeric(homeAway.avg_home).toLocaleString('es-ES')} />
          <MobileMetric label="Media fuera" value={numeric(homeAway.avg_away).toLocaleString('es-ES')} />
        </MobileMetricGrid>
        <MobileSectionHeading>Referencia</MobileSectionHeading>
        <MobileListRow title={gap.leader_name ?? 'Líder de la liga'} subtitle="Puntuación de referencia" trailing={numeric(gap.leader_points)} />
      </>
    );
  } else if (section === 'next-round' || section === 'market') {
    const round = await getNextRoundData(userId ?? null);
    const entries = section === 'market' ? round.marketOpportunities : round.captainRecommendations;
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric label="Jornada" value={round.nextRound?.round_name ?? '—'} tone="accent" />
          <MobileMetric label={section === 'market' ? 'Oportunidades' : 'Capitanes'} value={entries?.length ?? 0} />
        </MobileMetricGrid>
        <MobileSectionHeading>{section === 'market' ? 'Oportunidades' : 'Mejor forma'}</MobileSectionHeading>
        {(entries ?? []).slice(0, 8).map((player: RecordValue, index: number) => (
          <MobileListRow
            key={String(player.player_id ?? player.id ?? index)}
            href={player.player_id || player.id ? `/player/${player.player_id ?? player.id}` : undefined}
            leading={<strong>{index + 1}</strong>}
            title={playerName(player)}
            subtitle={player.team ?? player.form_label}
            trailing={player.avg_recent_points ? Number(player.avg_recent_points).toFixed(1) : undefined}
          />
        ))}
      </>
    );
  } else {
    const league = await getLeagueDashboardData();
    const players = [...(league.hotStreaks ?? []), ...(league.coldStreaks ?? [])];
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric label="Media liga" value={numeric(league.leagueAverage).toLocaleString('es-ES')} />
          <MobileMetric label="MVP recientes" value={league.roundMVPs?.length ?? 0} tone="accent" />
        </MobileMetricGrid>
        <MobileSectionHeading>Rachas</MobileSectionHeading>
        {players.slice(0, 8).map((player: RecordValue, index: number) => (
          <MobileListRow key={String(player.player_id ?? player.id ?? index)} title={playerName(player)} subtitle={player.team ?? 'Racha de liga'} trailing={player.streak ?? player.avg_points} />
        ))}
      </>
    );
  }

  return (
    <MobileDetailScaffold
      title={route.definition.title}
      context="Dashboard"
      backHref="/dashboard"
      description="Una vista enfocada para decidir rápido sin recorrer todo el dashboard."
    >
      {content}
    </MobileDetailScaffold>
  );
}
