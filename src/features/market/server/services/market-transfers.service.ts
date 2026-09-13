import 'server-only';
import type {
  MarketTransfersInput,
  MarketTransferPage,
  MarketValueDetail,
  MarketDuelDetail,
} from '../../models/market-transfers';
import {
  readMarketTransferPage,
  readMarketValueDetails,
  readMarketDuelDetails,
} from '../queries/market-transfers.query';
import {
  mapMarketTransferPage,
  mapMarketValueDetail,
  mapMarketDuelDetail,
} from '../mappers/market-transfers.mapper';

export const MARKET_TRANSFER_READ_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'explicit-filters-only',
  serverCache: 'none',
  transfersMaxAgeSeconds: 60,
  valueDetailsMaxAgeSeconds: 300,
  duelDetailsMaxAgeSeconds: 60,
  staleWhileRevalidateSeconds: 60,
} as const);

export async function getLiveMarketTransfers(
  params: MarketTransfersInput
): Promise<MarketTransferPage> {
  return mapMarketTransferPage(await readMarketTransferPage(params));
}

export async function getBestValueDetails(transferId: number): Promise<MarketValueDetail[]> {
  return (await readMarketValueDetails(transferId)).map(mapMarketValueDetail);
}

export async function getBiddingDuelDetails(
  userId: number,
  opponentId: number
): Promise<MarketDuelDetail[]> {
  return (await readMarketDuelDetails(userId, opponentId)).map(mapMarketDuelDetail);
}
