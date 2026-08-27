import { MobileListRow } from './MobileScreen';

type RecordValue = Record<string, any>;

const TITLE_KEYS = ['name', 'player_name', 'user_name', 'round_name', 'title', 'comprador'];
const SUBTITLE_KEYS = ['team', 'player_team', 'description', 'vendedor', 'label', 'position'];
const VALUE_KEYS = [
  'points',
  'total_points',
  'avg_points',
  'score',
  'wins',
  'count',
  'precio',
  'price',
  'profit',
  'total_spent',
];

function firstValue(record: RecordValue, keys: string[]): unknown {
  return keys.map((key) => record[key]).find((value) => value !== undefined && value !== null);
}

export function normalizeMobileRecords(value: unknown, limit = 20): RecordValue[] {
  if (Array.isArray(value)) return value.filter((item) => item && typeof item === 'object').slice(0, limit);
  if (!value || typeof value !== 'object') return [];

  const record = value as RecordValue;
  const nested = Object.values(record).find(Array.isArray);
  if (nested) return normalizeMobileRecords(nested, limit);
  return [record];
}

export default function MobileRecordList({
  data,
  emptyMessage = 'No hay datos disponibles para esta vista.',
  linkPrefix,
}: {
  data: unknown;
  emptyMessage?: string;
  linkPrefix?: string;
}) {
  const records = normalizeMobileRecords(data);

  if (!records.length) return <p className="mobile-record-empty">{emptyMessage}</p>;

  return (
    <div>
      {records.map((record, index) => {
        const title = firstValue(record, TITLE_KEYS) ?? `Registro ${index + 1}`;
        const subtitle = firstValue(record, SUBTITLE_KEYS);
        const value = firstValue(record, VALUE_KEYS);
        const entityId = record.player_id ?? record.user_id ?? record.id;
        return (
          <MobileListRow
            key={String(entityId ?? index)}
            href={linkPrefix && entityId != null ? `${linkPrefix}/${entityId}` : undefined}
            leading={<span className="mobile-record-index">{index + 1}</span>}
            title={String(title)}
            subtitle={subtitle != null ? String(subtitle) : undefined}
            trailing={value != null ? Number(value).toLocaleString('es-ES') : undefined}
          />
        );
      })}
    </div>
  );
}
