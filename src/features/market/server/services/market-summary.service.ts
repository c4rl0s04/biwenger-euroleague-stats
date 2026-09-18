import 'server-only';
export async function getTopTransferredPlayer(): Promise<TopTransferredPlayer[]> {
  return (await readTopTransferredPlayer()).map(mapTopTransferredPlayer);
}
export async function getRecordTransfer(): Promise<EnrichedTransfer[]> {
  return (await readRecordTransfer()).map(mapEnrichedTransfer);
}
export async function getBigSpender(): Promise<BigSpender[]> {
  return (await readBigSpender()).map(mapBigSpender);
}
export async function getBestSeller(): Promise<BestSeller[]> {
  return (await readBestSeller()).map(mapBestSeller);
}
export async function getMostOwnersPlayer(): Promise<MostOwnersPlayer[]> {
  return (await readMostOwnersPlayer()).map(mapMostOwnersPlayer);
}
export async function getManagerMarketStats(): Promise<ManagerMarketStats[]> {
  return (await readManagerMarketStats()).map(mapManagerMarketStats);
}
import type {
  TopTransferredPlayer,
  EnrichedTransfer,
  BigSpender,
  BestSeller,
  MostOwnersPlayer,
  ManagerMarketStats,
} from '../../models/market-summary';
import {
  readTopTransferredPlayer,
  readRecordTransfer,
  readBigSpender,
  readBestSeller,
  readMostOwnersPlayer,
  readManagerMarketStats,
} from '../queries/market-summary.query';
import {
  mapTopTransferredPlayer,
  mapEnrichedTransfer,
  mapBigSpender,
  mapBestSeller,
  mapMostOwnersPlayer,
  mapManagerMarketStats,
} from '../mappers/market-summary.mapper';
export const MARKET_SUMMARY_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);
