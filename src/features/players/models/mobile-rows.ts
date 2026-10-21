import type { MobileRecordRow } from '@/components/mobile/MobileRecordList';
import type { PlayerCatalogueItemViewModel } from './player-catalogue';
import type { PlayerProfileMatchViewModel, PlayerTransferViewModel } from './player-profile';

export function mapCatalogueRows(players: PlayerCatalogueItemViewModel[]): MobileRecordRow[] {
  return players.slice(0, 20).map((player, index) => ({
    key: String(player.id ?? index),
    title: player.name ?? `Registro ${index + 1}`,
    subtitle: player.team ?? player.position,
    value: Number(player.total_points ?? player.price),
    href: player.id != null ? `/player/${player.id}` : null,
  }));
}

export function mapRecentMatchRows(matches: PlayerProfileMatchViewModel[]): MobileRecordRow[] {
  return matches.slice(0, 20).map((match, index) => ({
    key: String(index),
    title: match.round_name ?? `Registro ${index + 1}`,
  }));
}

export function mapPlayerTransferRows(transfers: PlayerTransferViewModel[]): MobileRecordRow[] {
  return transfers
    .slice(0, 20)
    .map((_, index) => ({ key: String(index), title: `Registro ${index + 1}` }));
}

// The old Insights list rendered its two collection objects as ordinal-only rows.
export const catalogueInsightRows: MobileRecordRow[] = [
  { key: '0', title: 'Registro 1' },
  { key: '1', title: 'Registro 2' },
];
