import 'server-only';
import type { MarketSectionModel } from '../../models/market-section';
import { getAllTransfers } from '../../../trends/server/services/market-activity.service';
import { getMarketTrendsAnalysis } from '../../../trends/server/services/market-trends.service';
import { fetchMarketStats } from '../../../analytics/server/services/market-analytics.service';
import {
  mapMarketTransferRows,
  mapMarketInvestmentRows,
  mapMarketTrendRows,
} from '../mappers/market-section.mapper';

export const MARKET_SECTION_POLICY = Object.freeze({
  access: 'public-fantasy-statistics-with-existing-app-layout-protection',
  identity: 'none',
  serverCache: 'none',
  validation: 'existing-requireMobileRoute-before-service',
} as const);

/** Non-bids sections only. Bids retains its legacy failure pending explicit approval. */
export async function getMobileMarketSection(
  section: 'transfers' | 'trends' | 'investments'
): Promise<MarketSectionModel> {
  if (section === 'transfers') return { rows: mapMarketTransferRows(await getAllTransfers()) };
  if (section === 'trends') return { rows: mapMarketTrendRows(await getMarketTrendsAnalysis(30)) };
  const stats = await fetchMarketStats();
  return {
    rows: mapMarketInvestmentRows([
      ...(stats.bestFlip ?? []),
      ...(stats.bestRevaluation ?? []),
      ...(stats.worstFlip ?? []),
      ...(stats.missedOpportunity ?? []),
    ]),
  };
}
