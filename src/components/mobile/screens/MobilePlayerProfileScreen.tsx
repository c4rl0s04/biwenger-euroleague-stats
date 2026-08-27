import { Activity, CalendarDays, ChartSpline, CircleDollarSign, History, Shield } from 'lucide-react';

import {
  MobileBackHeader,
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

type Player = Record<string, any>;
const money = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

export default function MobilePlayerProfileScreen({ player }: { player: Player }) {
  const next = player.nextMatch;
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileBackHeader title={player.name} context={player.team_name ?? 'Jugador'} backHref="/players" />

      <section className="mobile-profile-identity">
        <span className="mobile-profile-badge">{player.position ?? '—'}</span>
        <div>
          <p>{player.status ?? 'Disponible'}</p>
          <h2>{player.name}</h2>
          <span>{player.team_name ?? 'Sin equipo'} · {player.owner_name ?? 'Libre'}</span>
        </div>
      </section>

      <MobileMetricGrid>
        <MobileMetric label="Precio" value={`${money.format(Number(player.price ?? 0))}€`} tone="accent" />
        <MobileMetric label="Media" value={Number(player.season_avg ?? 0).toLocaleString('es-ES')} detail={`${player.games_played ?? 0} partidos`} />
        <MobileMetric label="Puntos" value={Number(player.total_points ?? player.puntos ?? 0).toLocaleString('es-ES')} tone="positive" />
        <MobileMetric label="Variación" value={`${Number(player.price_increment ?? 0) > 0 ? '+' : ''}${money.format(Number(player.price_increment ?? 0))}€`} />
      </MobileMetricGrid>

      <MobileSectionHeading>Próximo partido</MobileSectionHeading>
      <MobileListRow
        leading={<CalendarDays size={20} aria-hidden="true" />}
        title={next ? `${next.home_team ?? ''} – ${next.away_team ?? ''}` : 'Sin próximo partido'}
        subtitle={next?.match_date ? new Date(next.match_date).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Calendario pendiente'}
        trailing={next?.round_name}
      />

      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <div>
        <MobileSectionLink href={`/player/${player.id}/performance`} title="Rendimiento" description="Forma, splits y métricas avanzadas" icon={Activity} accent="green" />
        <MobileSectionLink href={`/player/${player.id}/market`} title="Mercado" description="Precio, propiedad y traspasos" icon={CircleDollarSign} />
        <MobileSectionLink href={`/player/${player.id}/history`} title="Historial" description="Partidos y puntuaciones jornada a jornada" icon={History} accent="blue" />
      </div>

      <MobileSectionHeading>Contexto</MobileSectionHeading>
      <MobileListRow leading={<Shield size={20} aria-hidden="true" />} title="Propietario" subtitle={player.owner_name ?? 'Disponible en el mercado'} trailing={player.owner_name ? 'En plantilla' : 'Libre'} />
    </MobileScreen>
  );
}
