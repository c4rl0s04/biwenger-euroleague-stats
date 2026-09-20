import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import type { CompareOpponentModel } from '../models/compare';
export default function CompareOpponentScreen({
  model,
  title,
}: {
  model: CompareOpponentModel;
  title: string;
}) {
  const { current, opponent, currentStanding, opponentStanding } = model;
  return (
    <MobileDetailScaffold
      title={title}
      context={`${current.name} vs ${opponent.name}`}
      backHref="/compare"
    >
      <div className="mobile-versus-header">
        <strong>{current.name}</strong>
        <span>VS</span>
        <strong>{opponent.name}</strong>
      </div>
      <MobileMetricGrid>
        <MobileMetric
          label={`${current.name} puntos`}
          value={currentStanding?.total_points ?? 0}
          tone="accent"
        />
        <MobileMetric
          label={`${opponent.name} puntos`}
          value={opponentStanding?.total_points ?? 0}
        />
        <MobileMetric
          label={`${current.name} posición`}
          value={`#${currentStanding?.position ?? '—'}`}
        />
        <MobileMetric
          label={`${opponent.name} posición`}
          value={`#${opponentStanding?.position ?? '—'}`}
        />
      </MobileMetricGrid>
      <MobileSectionHeading>Últimas jornadas</MobileSectionHeading>
      <MobileRecordList data={model.recentHistory} />
    </MobileDetailScaffold>
  );
}
