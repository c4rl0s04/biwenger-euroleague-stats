import {
  Activity,
  BellRing,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  Gauge,
  ShieldCheck,
} from 'lucide-react';

import type { MobileDashboardViewModel } from '@/lib/mobile/view-models/dashboard';

import MobileNewsStrip from '../MobileNewsStrip';
import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

const compactMoney = new Intl.NumberFormat('es-ES', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export default function MobileDashboardScreen({ data }: { data: MobileDashboardViewModel }) {
  const position = data.position > 0 ? `#${data.position}` : '—';

  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader
        eyebrow={data.managerName}
        title="Dashboard"
        description="Lo importante de tu temporada, ahora"
      />

      <MobileNewsStrip items={data.news} />

      <MobileMetricGrid>
        <MobileMetric label="Posición" value={position} detail={`${data.victories} victorias`} tone="accent" />
        <MobileMetric label="Puntos" value={data.points.toLocaleString('es-ES')} detail={`${data.averagePoints.toLocaleString('es-ES')} por jornada`} />
        <MobileMetric label="Plantilla" value={data.squadSize || '—'} detail="jugadores" tone="positive" />
        <MobileMetric label="Valor" value={data.squadValue ? `${compactMoney.format(data.squadValue)}€` : '—'} detail="valor de equipo" />
      </MobileMetricGrid>

      {data.alerts.length > 0 && (
        <>
          <MobileSectionHeading>Requiere atención</MobileSectionHeading>
          <div className="mobile-alert-list">
            {data.alerts.map((alert) => (
              <MobileListRow
                key={alert.id}
                leading={<BellRing size={19} aria-hidden="true" />}
                title={alert.title}
                subtitle={alert.severity === 'warning' ? 'Revísalo antes de la jornada' : 'Aviso de tu equipo'}
              />
            ))}
          </div>
        </>
      )}

      <MobileSectionHeading>Analiza y decide</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/dashboard/season" title="Mi temporada" description="Racha, jornadas y capitanes" icon={Gauge} accent="green" />
        <MobileSectionLink href="/dashboard/next-round" title={data.nextRound?.name ?? 'Próxima jornada'} description="Forma, capitán y partidos" icon={CalendarClock} />
        <MobileSectionLink href="/dashboard/market" title="Mercado y jugadores" description="Oportunidades y actividad" icon={CircleDollarSign} accent="blue" />
        <MobileSectionLink href="/dashboard/comparison" title="Comparativa" description="Distancia con líder y media" icon={Activity} accent="violet" />
        <MobileSectionLink href="/dashboard/league" title="Pulso de la liga" description="MVP, rachas y rendimiento" icon={ChartNoAxesCombined} accent="red" />
      </div>

      {data.formPlayers.length > 0 && (
        <>
          <MobileSectionHeading>En forma</MobileSectionHeading>
          <div className="mobile-inline-callout">
            <ShieldCheck size={21} aria-hidden="true" />
            <p>{data.formPlayers.join(' · ')}</p>
          </div>
        </>
      )}
    </MobileScreen>
  );
}
