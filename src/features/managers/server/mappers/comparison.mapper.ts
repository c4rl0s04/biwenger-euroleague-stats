import 'server-only';
import type { ComparisonManagerRow, ComparisonSquadRow } from '../queries/comparison.query';
import type { ComparisonManager, ComparisonSquadMember } from '../../models/comparison';

export function mapComparisonManager(row: ComparisonManagerRow): ComparisonManager {
  return { id: row.id, name: row.name, icon: row.icon, color_index: row.color_index };
}
export function mapComparisonSquadMember(row: ComparisonSquadRow): ComparisonSquadMember {
  return {
    id: row.id,
    name: row.name,
    position: row.position,
    team: row.team,
    status: row.status,
    average: parseFloat(String(row.average)) || 0,
    points: parseInt(String(row.points)) || 0,
    price: parseInt(String(row.price)) || 0,
  };
}
