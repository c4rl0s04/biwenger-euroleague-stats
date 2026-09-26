import 'server-only';
import type {
  MarketActivityTransfer,
  MarketActivityTrend,
  MarketActivityKPIs,
  MarketActivityOverview,
} from '../../models/market-activity';
import {
  readMarketActivityTransfers,
  readMarketActivityTrends,
  readMarketActivityKPIs,
} from '../queries/market-activity.query';
import {
  mapMarketActivityTransfer,
  mapMarketActivityTrend,
  mapMarketActivityKPIs,
} from '../mappers/market-activity.mapper';

export const MARKET_ACTIVITY_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
  httpMaxAgeSeconds: 300,
  httpStaleWhileRevalidateSeconds: 60,
} as const);

export async function getAllTransfers(limit = 100, offset = 0): Promise<MarketActivityTransfer[]> {
  return (await readMarketActivityTransfers(limit, offset)).map(mapMarketActivityTransfer);
}

export async function getMarketTrends(): Promise<MarketActivityTrend[]> {
  return (await readMarketActivityTrends()).map(mapMarketActivityTrend);
}

export async function getMarketKPIs(): Promise<MarketActivityKPIs> {
  return mapMarketActivityKPIs(await readMarketActivityKPIs());
}

/** Preserve three independent season-scoped reads and their existing query defaults. */
export async function getMarketPageData(): Promise<MarketActivityOverview> {
  const [kpis, transfers, trends] = await Promise.all([
    getMarketKPIs(),
    getAllTransfers(),
    getMarketTrends(),
  ]);
  return { kpis, transfers, trends };
}
