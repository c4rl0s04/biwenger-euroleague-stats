import { MobileListRow } from './MobileScreen';

export interface MobileRecordRow {
  key: string;
  title: string;
  subtitle?: string | null;
  value?: number | null;
  href?: string | null;
}

export default function MobileRecordList({
  rows,
  emptyMessage = 'No hay datos disponibles para esta vista.',
}: {
  rows: MobileRecordRow[];
  emptyMessage?: string;
}) {
  if (!rows.length) return <p className="mobile-record-empty">{emptyMessage}</p>;
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
