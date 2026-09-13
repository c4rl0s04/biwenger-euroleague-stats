import type { PorrasStats } from '../../models/predictions';
import type { PredictionSectionModel } from '../../models/prediction-screen';

/**
 * Preserve MobileRecordList's first-20 projection. The existing ranking/evolution
 * labels are "Registro N": usuario/aciertos are not among that control's keys.
 * Enriching those rows would be a product change, not a structural migration.
 * Route validation remains with requireMobileRoute, before the service is called.
 */
export function mapPredictionSection(stats: PorrasStats, section: string): PredictionSectionModel {
  if (section === 'evolution' || section === 'ranking') {
    const records = section === 'evolution' ? stats.performance : stats.table_stats;
    return {
      rows: records.slice(0, 20).map((row, index) => ({
        key: String(row.user_id),
        title: `Registro ${index + 1}`,
        ...(section === 'ranking' ? { href: `/user/${row.user_id}` } : {}),
      })),
    };
  }
  const records =
    section === 'teams' ? stats.porra_stats.predictable_teams : stats.history.jornadas;
  return {
    rows: records.slice(0, 20).map((row, index) => ({
      key: String(row.id),
      title: row.name ?? `Registro ${index + 1}`,
    })),
  };
}
