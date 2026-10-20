import type { MobileRecordRow } from '@/components/mobile/MobileRecordList';
import type { CompareOpponentModel } from './compare';

export function mapCompareHistoryRows(
  records: CompareOpponentModel['recentHistory']
): MobileRecordRow[] {
  return records.slice(0, 20).map((record, index) => ({
    key: String(index),
    title: record.round_name ?? `Registro ${index + 1}`,
  }));
}
