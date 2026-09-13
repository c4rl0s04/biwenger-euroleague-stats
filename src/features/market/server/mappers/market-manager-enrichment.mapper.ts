import type { ManagerDirectoryViewModel } from '@/features/managers/public';
import type {
  NamedManagerEnrichment,
  BuyerManagerEnrichment,
  BiggestStealEnrichment,
} from '../../models/market-analytics';
import type { BiggestSteal } from '../../models/market-auctions';
import type { TopTrader } from '../../models/market-investments';

// Intentionally match the first exact name, including null, as the historical aggregate did.
export function enrichNamedManagers<T extends { name: string | null }>(
  rows: T[],
  users: ManagerDirectoryViewModel[]
): (T & NamedManagerEnrichment)[] {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.map((row) => {
    const user = users.find((user) => user.name === row.name);
    return user
      ? {
          ...row,
          id: user.id,
          icon: user.icon,
          color_index: user.color_index,
          user_color_index: user.color_index,
        }
      : row;
  });
}
export function enrichBuyers<T extends { comprador: string | null }>(
  rows: T[],
  users: ManagerDirectoryViewModel[]
): (T & BuyerManagerEnrichment)[] {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.map((row) => {
    const user = users.find((user) => user.name === row.comprador);
    return user
      ? {
          ...row,
          buyer_id: user.id,
          buyer_icon: user.icon,
          buyer_color: user.color_index,
          user_color_index: user.color_index,
        }
      : row;
  });
}
export function enrichTraders(
  rows: TopTrader[],
  users: ManagerDirectoryViewModel[]
): (TopTrader & { user_icon?: string | null })[] {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.map((row) => {
    const user = users.find((user) => user.name === row.user_name);
    return user
      ? { ...row, user_id: user.id, user_icon: user.icon, user_color_index: user.color_index }
      : row;
  });
}
export function enrichSteals(
  rows: BiggestSteal[],
  users: ManagerDirectoryViewModel[]
): (BiggestSteal & BiggestStealEnrichment)[] {
  if (!Array.isArray(rows) || !rows.length) return [];
  return rows.map((row) => {
    const winner = users.find((user) => user.name === row.winner);
    const withWinner = winner
      ? {
          ...row,
          winner_id: winner.id,
          winner_icon: winner.icon,
          winner_color: winner.color_index,
          user_color_index: winner.color_index,
        }
      : row;
    const runner = users.find((user) => user.name === row.second_bidder_name);
    // Runner enrichment intentionally overwrites the shared legacy color alias.
    return runner
      ? {
          ...withWinner,
          second_bidder_id: runner.id,
          second_bidder_icon: runner.icon,
          second_bidder_color: runner.color_index,
          user_color_index: runner.color_index,
        }
      : withWinner;
  });
}
