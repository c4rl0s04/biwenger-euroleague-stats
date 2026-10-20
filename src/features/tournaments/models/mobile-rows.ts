import type { MobileRecordRow } from '@/components/mobile/MobileRecordList';
import type { TournamentStanding, TournamentFixture } from './tournaments';

export function mapTournamentRows(
  records: (TournamentStanding | TournamentFixture)[],
  standings: boolean
): MobileRecordRow[] {
  return records.slice(0, 20).map((record, index) => {
    const id = 'user_id' in record ? (record.user_id ?? record.id) : record.id;
    return {
      key: String(id ?? index),
      title:
        ('user_name' in record ? record.user_name : record.round_name) ?? `Registro ${index + 1}`,
      subtitle: 'position' in record && record.position != null ? String(record.position) : null,
      value: 'points' in record ? record.points : null,
      href: standings && id != null ? `/user/${id}` : null,
    };
  });
}
