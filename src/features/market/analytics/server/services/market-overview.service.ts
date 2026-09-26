import 'server-only';
import {
  readMarketOverview,
  readMarketPositions,
  readMarketDuels,
} from '../queries/market-overview.query';
import { mapMarketOverview, mapMarketPositions } from '../mappers/market-overview.mapper';
import { mapMarketDuels } from '../mappers/market-duels.mapper';
import type {
  MarketOverviewKPIs,
  PositionAnalysis,
  BiddingDuelsStats,
} from '../../models/market-overview';
export async function getMarketOverviewKPIs(): Promise<MarketOverviewKPIs> {
  return mapMarketOverview((await readMarketOverview())[0]);
}
export async function getPositionAnalysis(): Promise<PositionAnalysis> {
  return mapMarketPositions(await readMarketPositions());
}
export async function getBiddingDuelsStats(): Promise<BiddingDuelsStats> {
  return mapMarketDuels(await readMarketDuels());
}
export const MARKET_OVERVIEW_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);
