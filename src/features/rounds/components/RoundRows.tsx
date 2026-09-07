import { MobileListRow } from '@/components/mobile/MobileScreen';
import type { RoundDisplayRow } from '../models/round-screen';

export default function RoundRows({ rows }: { rows: RoundDisplayRow[] }) {
  if (!rows.length)
    return <p className="mobile-record-empty">No hay datos disponibles para esta vista.</p>;
  return (
    <div>
      {rows.map((row) => (
        <MobileListRow
          key={row.key}
          href={row.href}
          leading={<span className="mobile-record-index">{row.index}</span>}
          title={row.title}
          subtitle={row.subtitle}
          trailing={row.value}
        />
      ))}
    </div>
  );
}
