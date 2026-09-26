import type { MarketActivityTransfer } from '../../../trends/models/market-activity';
import type { MarketTrendDay } from '../../../trends/models/market-trends';
import type {
  SingleFlip,
  BestRevaluation,
  MissedOpportunity,
} from '../../../analytics/models/market-investments';
import type { MarketSectionRow } from '../../models/market-section';

// Preserve the original MobileRecordList limit, nullish precedence and ordinal fallback.
export function mapMarketTransferRows(records: MarketActivityTransfer[]): MarketSectionRow[] {
  return records.slice(0, 20).map((record, index) => {
    const id = record.player_id ?? record.id;
    return {
      key: String(id ?? index),
      title: record.comprador ?? `Registro ${index + 1}`,
      subtitle: record.vendedor,
      value: record.precio,
      href: id != null ? `/player/${id}` : null,
    };
  });
}

export function mapMarketInvestmentRows(
  records: (SingleFlip | BestRevaluation | MissedOpportunity)[]
): MarketSectionRow[] {
  return records.slice(0, 20).map((record, index) => ({
    key: String(record.player_id ?? record.user_id ?? index),
    title: record.player_name ?? record.user_name ?? `Registro ${index + 1}`,
    subtitle: 'player_team' in record ? record.player_team : null,
    value: 'profit' in record ? record.profit : null,
    href: null,
  }));
}

export function mapMarketTrendRows(records: MarketTrendDay[]): MarketSectionRow[] {
  // The legacy generic list recognizes none of the trend fields. Preserve its visible
  // ordinal rows; displaying volume/price/date here would be a separate product change.
  return records.slice(0, 20).map((_, index) => ({
    key: String(index),
    title: `Registro ${index + 1}`,
    subtitle: null,
    value: null,
    href: null,
  }));
}
