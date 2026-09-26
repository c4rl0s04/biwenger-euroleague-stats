import 'server-only';
import type { MarketTrendDay } from '../../models/market-trends';
import { mapMarketTrend } from '../mappers/market-trends.mapper';
import { readMarketTrendRows } from '../queries/market-trends.query';

export const MARKET_TRENDS_POLICY = Object.freeze({
  access: 'public-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
  httpMaxAgeSeconds: 60,
  httpStaleWhileRevalidateSeconds: 60,
} as const);

/** No request/persistent cache. Internal callers also use 14 days, unlike the HTTP selector. */
export async function getMarketTrendsAnalysis(days = 30): Promise<MarketTrendDay[]> {
  return (await readMarketTrendRows(days)).map(mapMarketTrend);
}
