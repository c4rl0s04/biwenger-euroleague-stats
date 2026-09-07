import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import RoundRows from './RoundRows';
import type { RoundSectionViewModel } from '../models/round-screen';

export default function RoundSectionScreen({
  title,
  roundId,
  section,
  data,
}: {
  title: string;
  roundId: string;
  section: string;
  data: RoundSectionViewModel;
}) {
  return (
    <MobileDetailScaffold
      title={title}
      context={`Jornada ${roundId}`}
      backHref={`/rounds?roundId=${roundId}`}
    >
      {section === 'lineup' && (
        <MobileMetricGrid>
          <MobileMetric label="Puntos" value={data.points} tone="accent" />
          <MobileMetric label="Ideal" value={data.ideal} />
        </MobileMetricGrid>
      )}
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      <RoundRows rows={data.rows} />
    </MobileDetailScaffold>
  );
}
