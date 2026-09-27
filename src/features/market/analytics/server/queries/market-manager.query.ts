import 'server-only';
import { readManagerDirectory as readRaw } from '@/lib/competition/server';
import type { ManagerDirectoryViewModel } from '../../models/market-analytics';

export async function readMarketManagerDirectory(): Promise<ManagerDirectoryViewModel[]> {
  const rows = await readRaw();
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    icon: row.icon,
    color_index: row.color_index,
  }));
}
