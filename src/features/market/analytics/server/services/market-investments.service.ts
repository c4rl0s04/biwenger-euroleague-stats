import 'server-only';
export async function getBestRevaluation(): Promise<BestRevaluation[]> {
  return (await readBestRevaluation()).map(mapBestRevaluation);
}
export async function getBestValuePlayer(): Promise<BestValuePlayer[]> {
  return (await readBestValuePlayer()).map(mapBestValuePlayer);
}
export async function getInfirmaryPlayers(): Promise<InfirmaryPlayer[]> {
  return (await readInfirmaryPlayers()).map(mapInfirmaryPlayer);
}
export async function getBestSingleFlip(): Promise<SingleFlip[]> {
  return (await readBestSingleFlip()).map(mapSingleFlip);
}
export async function getWorstSingleFlip(): Promise<SingleFlip[]> {
  return (await readWorstSingleFlip()).map(mapSingleFlip);
}
export async function getBestPercentageGain(): Promise<PercentageGain[]> {
  return (await readBestPercentageGain()).map(mapPercentageGain);
}
export async function getMissedOpportunity(): Promise<MissedOpportunity[]> {
  return (await readMissedOpportunity()).map(mapMissedOpportunity);
}
export async function getTopTrader(): Promise<TopTrader[]> {
  return (await readTopTrader()).map(mapTopTrader);
}
export async function getProfitablePlayer(): Promise<ProfitablePlayer[]> {
  return (await readProfitablePlayer()).map(mapProfitablePlayer);
}
export async function getLossyPlayer(): Promise<LossyPlayer[]> {
  return (await readLossyPlayer()).map(mapLossyPlayer);
}
export async function getQuickestFlip(): Promise<QuickFlip[]> {
  return (await readQuickestFlip()).map(mapQuickFlip);
}
export async function getLongestProfitableHold(): Promise<LongHold[]> {
  return (await readLongestProfitableHold()).map(mapLongHold);
}
export async function getWorstRevaluation(): Promise<Devaluation[]> {
  return (await readWorstRevaluation()).map(mapDevaluation);
}
import type {
  BestRevaluation,
  BestValuePlayer,
  InfirmaryPlayer,
  SingleFlip,
  PercentageGain,
  MissedOpportunity,
  TopTrader,
  ProfitablePlayer,
  LossyPlayer,
  QuickFlip,
  LongHold,
  Devaluation,
} from '../../models/market-investments';
import {
  readBestRevaluation,
  readBestValuePlayer,
  readInfirmaryPlayers,
  readBestSingleFlip,
  readWorstSingleFlip,
  readBestPercentageGain,
  readMissedOpportunity,
  readTopTrader,
  readProfitablePlayer,
  readLossyPlayer,
  readQuickestFlip,
  readLongestProfitableHold,
  readWorstRevaluation,
} from '../queries/market-investments.query';
import {
  mapBestRevaluation,
  mapBestValuePlayer,
  mapInfirmaryPlayer,
  mapSingleFlip,
  mapPercentageGain,
  mapMissedOpportunity,
  mapTopTrader,
  mapProfitablePlayer,
  mapLossyPlayer,
  mapQuickFlip,
  mapLongHold,
  mapDevaluation,
} from '../mappers/market-investments.mapper';
export const MARKET_INVESTMENTS_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);
