import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';

import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileSectionHeading,
} from '@/components/mobile/MobileScreen';
import type { PlayoffDetailModel } from '../models/playoff-screen';
export default function PlayoffDetailScreen({
  model,
  title,
}: {
  model: PlayoffDetailModel;
  title: string;
}) {
  const { user, rows } = model;
  return (
    <MobileDetailScaffold title={title} context={user.userName!} backHref="/playoffs">
      <MobileMetricGrid>
        <MobileMetric label="Puntos" value={user.points} tone="accent" />
        <MobileMetric label="Aciertos" value={`${user.correctCount}/${user.totalCount}`} />
        <MobileMetric label="Precisión" value={`${user.accuracy.toFixed(0)}%`} tone="positive" />
        <MobileMetric label="Predicciones" value={user.predictions.length} />
      </MobileMetricGrid>
      <MobileSectionHeading>Cuadro</MobileSectionHeading>
      {rows.length ? (
        <div>
          {rows.map((row, index) => (
            <MobileListRow
              key={row.key}
              title={row.title}
              trailing={row.value}
              leading={<span className="mobile-record-index">{index + 1}</span>}
            />
          ))}
        </div>
      ) : (
        <p className="mobile-record-empty">No hay datos disponibles para esta vista.</p>
      )}
    </MobileDetailScaffold>
  );
}
