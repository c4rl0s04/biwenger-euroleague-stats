import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileOffersClient from './MobileOffersClient';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import {
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import type { LineupSectionModel } from '../models/section';

export default function LineupSectionScreen({
  section,
  title,
  model,
}: {
  section: string;
  title: string;
  model: LineupSectionModel;
}) {
  return (
    <MobileDetailScaffold title={title} context="Alineación" backHref="/lineup">
      {section === 'analysis' && (
        <MobileMetricGrid>
          <MobileMetric label="Jugadores" value={model.playerCount} tone="accent" />
          <MobileMetric
            label="Valor"
            value={`${Number(model.totalValue).toLocaleString('es-ES')}€`}
          />
          <MobileMetric label="Subiendo" value={model.risingCount} tone="positive" />
          <MobileMetric label="Bajando" value={model.fallingCount} tone="negative" />
        </MobileMetricGrid>
      )}
      <MobileSectionHeading>
        {section === 'offers' ? 'Pendientes' : 'Plantilla'}
      </MobileSectionHeading>
      {section === 'offers' ? <MobileOffersClient /> : <MobileRecordList rows={model.rows} />}
    </MobileDetailScaffold>
  );
}
