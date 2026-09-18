import 'server-only';
import type { ManagerDirectoryRow } from '../queries/manager-directory.query';
import type { ManagerDirectoryViewModel } from '../../models/manager-directory';

export function mapManagerDirectoryRow(row: ManagerDirectoryRow): ManagerDirectoryViewModel {
  return {
    id: String(row.id),
    name: row.name,
    icon: row.icon,
    color_index: row.color_index,
  };
}
