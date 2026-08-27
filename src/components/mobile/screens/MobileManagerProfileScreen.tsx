import { ChartSpline, Medal, Sparkles, Trophy, Users } from 'lucide-react';

import {
  MobileBackHeader,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

type RecordValue = Record<string, any>;

export default function MobileManagerProfileScreen({ stats, squad }: { stats: RecordValue; squad: RecordValue }) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileBackHeader title={stats.name} context="Perfil de mánager" backHref="/standings" />
      <section className="mobile-profile-identity mobile-manager-identity">
        <span className="mobile-profile-badge">#{stats.position || '—'}</span>
        <div><p>Mánager</p><h2>{stats.name}</h2><span>{stats.rounds_played ?? 0} jornadas · {stats.victories ?? 0} victorias</span></div>
      </section>
      <MobileMetricGrid>
        <MobileMetric label="Posición" value={stats.position ? `#${stats.position}` : '—'} tone="accent" />
        <MobileMetric label="Puntos" value={Number(stats.total_points ?? 0).toLocaleString('es-ES')} />
        <MobileMetric label="Media" value={Number(stats.average_points ?? 0).toLocaleString('es-ES')} />
        <MobileMetric label="Plantilla" value={squad.player_count ?? squad.players?.length ?? 0} tone="positive" />
      </MobileMetricGrid>
      <MobileSectionHeading>Explorar perfil</MobileSectionHeading>
      <div>
        <MobileSectionLink href={`/user/${stats.id}/season`} title="Temporada" description="Récords y rendimiento acumulado" icon={Trophy} />
        <MobileSectionLink href={`/user/${stats.id}/squad`} title="Plantilla" description="Composición y valor actual" icon={Users} accent="green" />
        <MobileSectionLink href={`/user/${stats.id}/evolution`} title="Evolución" description="Puntos jornada a jornada" icon={ChartSpline} accent="blue" />
        <MobileSectionLink href={`/user/${stats.id}/contributors`} title="Contribuidores" description="Jugadores con mayor impacto" icon={Sparkles} accent="violet" />
        <MobileSectionLink href={`/user/${stats.id}/competitions`} title="Competiciones" description="Torneos, porras y trofeos" icon={Medal} />
      </div>
    </MobileScreen>
  );
}
