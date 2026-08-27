import { Activity, ChartNoAxesCombined, History, LayoutDashboard } from 'lucide-react';

import MobileRecordList from '../MobileRecordList';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';
import MobileSegmentedControl from '../MobileSegmentedControl';

type RecordValue = Record<string, any>;

export default function MobileRoundsScreen({ rounds, activeRoundId, roundData, userId }: { rounds: RecordValue[]; activeRoundId: string | number; roundData: RecordValue | null; userId: string | number }) {
  const user = roundData?.users?.find((entry: RecordValue) => String(entry.id) === String(userId));
  const round = rounds.find((entry) => String(entry.round_id) === String(activeRoundId));
  const players = user?.lineup?.players ?? [];
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Análisis" title="Jornadas" description={round?.round_name ?? 'Jornada activa'} />
      <div className="mobile-control-offset"><MobileSegmentedControl label="Seleccionar jornada" items={rounds.map((entry) => ({ label: String(entry.round_name).replace('Jornada ', 'J'), href: `/rounds?roundId=${entry.round_id}`, active: String(entry.round_id) === String(activeRoundId) }))} /></div>
      <MobileMetricGrid>
        <MobileMetric label="Tus puntos" value={Number(user?.points ?? 0).toLocaleString('es-ES')} tone="accent" />
        <MobileMetric label="Ideal" value={Number(user?.ideal_points ?? 0).toLocaleString('es-ES')} />
        <MobileMetric label="Eficiencia" value={`${Number(user?.coachRating?.efficiency ?? 0).toLocaleString('es-ES')}%`} tone="positive" />
        <MobileMetric label="Jugadores" value={players.length} />
      </MobileMetricGrid>
      <MobileSectionHeading>Alineación</MobileSectionHeading>
      <MobileRecordList data={players} linkPrefix="/player" />
      <MobileSectionHeading>Explorar jornada</MobileSectionHeading>
      <div>
        <MobileSectionLink href={`/rounds/${activeRoundId}/lineup`} title="Cancha" description="Quinteto, banquillo y puntuaciones" icon={LayoutDashboard} />
        <MobileSectionLink href={`/rounds/${activeRoundId}/stats`} title="Estadísticas" description="MVP y líderes de la jornada" icon={Activity} accent="green" />
        <MobileSectionLink href={`/rounds/${activeRoundId}/history`} title="Historial" description="Evolución del rendimiento" icon={History} accent="blue" />
        <MobileSectionLink href={`/rounds/${activeRoundId}/comparison`} title="Comparación" description="Tu eficiencia frente a la liga" icon={ChartNoAxesCombined} accent="violet" />
      </div>
    </MobileScreen>
  );
}
