import 'server-only';
export async function getRecordBid(): Promise<RecordBid[]> {
  const seasonId = await resolveMarketAuctionSeason();
  try {
    return (await readRecordBid(seasonId)).map(mapRecordBid);
  } catch (error: unknown) {
    console.warn('Could not fetch record bid:', (error as { message?: string }).message);
    return [];
  }
}
export async function getTheThief(): Promise<TheThief[]> {
  return (await readTheThief()).map(mapTheThief);
}
export async function getBiggestSteal(): Promise<BiggestSteal[]> {
  return (await readBiggestSteal()).map(mapBiggestSteal);
}
export async function getTheVictim(): Promise<TheVictim[]> {
  return (await readTheVictim()).map(mapTheVictim);
}
export async function getOverpayerManager(): Promise<OverpayerManager[]> {
  return (await readOverpayerManager()).map(mapOverpayerManager);
}
export async function getInflatedPlayer(): Promise<InflatedPlayer[]> {
  return (await readInflatedPlayer()).map(mapInflatedPlayer);
}
import type {
  RecordBid,
  TheThief,
  BiggestSteal,
  TheVictim,
  OverpayerManager,
  InflatedPlayer,
} from '../../models/market-auctions';
import {
  readRecordBid,
  readTheThief,
  readBiggestSteal,
  readTheVictim,
  readOverpayerManager,
  readInflatedPlayer,
  resolveMarketAuctionSeason,
} from '../queries/market-auctions.query';
import {
  mapRecordBid,
  mapTheThief,
  mapBiggestSteal,
  mapTheVictim,
  mapOverpayerManager,
  mapInflatedPlayer,
} from '../mappers/market-auctions.mapper';
export const MARKET_AUCTIONS_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);
