import { MobileListRow } from '@/components/mobile/MobileScreen';
import type { MarketSectionModel } from '../models/market-section';

export default function MarketSectionRows({ rows }: MarketSectionModel) {
  if (!rows.length) {
    return <p className="mobile-record-empty">No hay datos disponibles para esta vista.</p>;
  }
  return (
    <div>
      {rows.map((row, index) => (
        <MobileListRow
          key={row.key}
          href={row.href ?? undefined}
          leading={<span className="mobile-record-index">{index + 1}</span>}
          title={row.title}
          subtitle={row.subtitle ?? undefined}
          trailing={row.value != null ? Number(row.value).toLocaleString('es-ES') : undefined}
        />
      ))}
    </div>
  );
}
