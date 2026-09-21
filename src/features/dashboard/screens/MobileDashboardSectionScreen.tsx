import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import type { DashboardSectionContent } from '../models/section';
import type { DashboardDisplayPlayer } from '../models/dashboard';
import type {
  ManagerCaptainStats,
  ManagerSeasonStatsViewModel,
  ManagerHomeAwayStats,
} from '@/features/managers/public';
import type { LeaderGap } from '@/features/standings/public';
// Preserve the old optional display aliases (currently absent from the domain payload).
type CaptainDisplay = Partial<ManagerCaptainStats> & {
  captain_points?: number;
  total_points?: number;
  success_rate?: number;
  average?: number;
};

const numeric = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const playerName = (player: DashboardDisplayPlayer) =>
  String(player.name ?? player.player_name ?? 'Jugador');

export default function MobileDashboardSectionScreen({
  title,
  data,
}: {
  title: string;
  data: DashboardSectionContent;
}) {
  let content;

  if (data.kind === 'season') {
    const { dashboard } = data;
    const stats: Partial<ManagerSeasonStatsViewModel> = dashboard.seasonStats ?? {};
    const captain: CaptainDisplay = dashboard.captainStats ?? {};
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric
            label="Posición"
            value={numeric(stats.position) ? `#${stats.position}` : '—'}
            tone="accent"
          />
          <MobileMetric
            label="Puntos"
            value={numeric(stats.total_points).toLocaleString('es-ES')}
          />
          <MobileMetric
            label="Media"
            value={numeric(stats.average_points).toLocaleString('es-ES')}
            detail="por jornada"
          />
          <MobileMetric label="Podios" value={numeric(stats.podiums)} tone="positive" />
        </MobileMetricGrid>
        <MobileSectionHeading>Capitanes</MobileSectionHeading>
        <MobileListRow
          title="Puntos como capitán"
          trailing={numeric(captain.captain_points ?? captain.total_points)}
        />
        <MobileListRow
          title="Acierto medio"
          trailing={`${numeric(captain.success_rate ?? captain.average).toLocaleString('es-ES')}%`}
        />
      </>
    );
  } else if (data.kind === 'comparison') {
    const { dashboard } = data;
    const gap: Partial<LeaderGap> = dashboard.leaderGap ?? {};
    const homeAway: Partial<ManagerHomeAwayStats> = dashboard.homeAwayStats ?? {};
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric
            label="Tus puntos"
            value={numeric(gap.user_points).toLocaleString('es-ES')}
          />
          <MobileMetric
            label={gap.is_leader ? 'Ventaja' : 'Distancia'}
            value={`${gap.is_leader ? '+' : '-'}${numeric(gap.gap_to_second ?? gap.gap)}`}
            tone={gap.is_leader ? 'positive' : 'negative'}
          />
          <MobileMetric
            label="Media casa"
            value={numeric(homeAway.avg_home).toLocaleString('es-ES')}
          />
          <MobileMetric
            label="Media fuera"
            value={numeric(homeAway.avg_away).toLocaleString('es-ES')}
          />
        </MobileMetricGrid>
        <MobileSectionHeading>Referencia</MobileSectionHeading>
        <MobileListRow
          title={gap.leader_name ?? 'Líder de la liga'}
          subtitle="Puntuación de referencia"
          trailing={numeric(gap.leader_points)}
        />
      </>
    );
  } else if (data.kind === 'next-round' || data.kind === 'market') {
    const { round } = data;
    const entries =
      data.kind === 'market' ? round.marketOpportunities : round.captainRecommendations;
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric label="Jornada" value={round.nextRound?.round_name ?? '—'} tone="accent" />
          <MobileMetric
            label={data.kind === 'market' ? 'Oportunidades' : 'Capitanes'}
            value={entries?.length ?? 0}
          />
        </MobileMetricGrid>
        <MobileSectionHeading>
          {data.kind === 'market' ? 'Oportunidades' : 'Mejor forma'}
        </MobileSectionHeading>
        {(entries ?? []).slice(0, 8).map((player: DashboardDisplayPlayer, index: number) => (
          <MobileListRow
            key={String(player.player_id ?? player.id ?? index)}
            href={
              player.player_id || player.id ? `/player/${player.player_id ?? player.id}` : undefined
            }
            leading={<strong>{index + 1}</strong>}
            title={playerName(player)}
            subtitle={player.team ?? player.form_label}
            trailing={
              player.avg_recent_points != null
                ? Number(player.avg_recent_points).toFixed(1)
                : undefined
            }
          />
        ))}
      </>
    );
  } else {
    const { league } = data;
    const players = [...(league.hotStreaks ?? []), ...(league.coldStreaks ?? [])];
    content = (
      <>
        <MobileMetricGrid>
          <MobileMetric
            label="Media liga"
            value={numeric(league.leagueAverage).toLocaleString('es-ES')}
          />
          <MobileMetric label="MVP recientes" value={league.roundMVPs?.length ?? 0} tone="accent" />
        </MobileMetricGrid>
        <MobileSectionHeading>Rachas</MobileSectionHeading>
        {players.slice(0, 8).map((player: DashboardDisplayPlayer, index: number) => (
          <MobileListRow
            key={String(player.player_id ?? player.id ?? index)}
            title={playerName(player)}
            subtitle={player.team ?? 'Racha de liga'}
            trailing={player.streak ?? player.avg_points}
          />
        ))}
      </>
    );
  }

  return (
    <MobileDetailScaffold
      title={title}
      context="Dashboard"
      backHref="/dashboard"
      description="Una vista enfocada para decidir rápido sin recorrer todo el dashboard."
    >
      {content}
    </MobileDetailScaffold>
  );
}
