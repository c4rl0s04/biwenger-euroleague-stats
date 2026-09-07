import { Activity, ChartNoAxesCombined, History, LayoutDashboard } from 'lucide-react';

import RoundRows from './RoundRows';
import type { RoundOverviewViewModel } from '../models/round-screen';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '@/components/mobile/MobileScreen';
import MobileSegmentedControl from '@/components/mobile/MobileSegmentedControl';

export default function MobileRoundsScreen({ data }: { data: RoundOverviewViewModel }) {
  const { rounds, activeRoundId } = data;
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Análisis" title="Jornadas" description={data.description} />
      <div className="mobile-control-offset">
        <MobileSegmentedControl
          label="Seleccionar jornada"
          items={rounds.map((entry) => ({
            label: String(entry.round_name).replace('Jornada ', 'J'),
            href: `/rounds?roundId=${entry.round_id}`,
            active: String(entry.round_id) === String(activeRoundId),
          }))}
        />
      </div>
      <MobileMetricGrid>
        <MobileMetric label="Tus puntos" value={data.points} tone="accent" />
        <MobileMetric label="Ideal" value={data.ideal} />
        <MobileMetric label="Eficiencia" value={data.efficiency} tone="positive" />
        <MobileMetric label="Jugadores" value={data.playerCount} />
      </MobileMetricGrid>
      <MobileSectionHeading>Alineación</MobileSectionHeading>
      <RoundRows rows={data.rows} />
      <MobileSectionHeading>Explorar jornada</MobileSectionHeading>
      <div>
        <MobileSectionLink
          href={`/rounds/${activeRoundId}/lineup`}
          title="Cancha"
          description="Quinteto, banquillo y puntuaciones"
          icon={LayoutDashboard}
        />
        <MobileSectionLink
          href={`/rounds/${activeRoundId}/stats`}
          title="Estadísticas"
          description="MVP y líderes de la jornada"
          icon={Activity}
          accent="green"
        />
        <MobileSectionLink
          href={`/rounds/${activeRoundId}/history`}
          title="Historial"
          description="Evolución del rendimiento"
          icon={History}
          accent="blue"
        />
        <MobileSectionLink
          href={`/rounds/${activeRoundId}/comparison`}
          title="Comparación"
          description="Tu eficiencia frente a la liga"
          icon={ChartNoAxesCombined}
          accent="violet"
        />
      </div>
    </MobileScreen>
  );
}
