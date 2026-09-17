import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MobileListRow, MobileSectionHeading } from '@/components/mobile/MobileScreen';
import type { PredictionSectionModel } from '../models/prediction-screen';

export default function PredictionSectionScreen({
  title,
  model,
}: {
  title: string;
  model: PredictionSectionModel;
}) {
  return (
    <MobileDetailScaffold title={title} context="Porras" backHref="/predictions">
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      {model.rows.length ? (
        <div>
          {model.rows.map((row, index) => (
            <MobileListRow
              key={row.key}
              href={row.href}
              leading={<span className="mobile-record-index">{index + 1}</span>}
              title={row.title}
            />
          ))}
        </div>
      ) : (
        <p className="mobile-record-empty">No hay datos disponibles para esta vista.</p>
      )}
    </MobileDetailScaffold>
  );
}
