import 'server-only';
import { readMarketManagerDirectory as getAllUsers } from '../queries/market-manager.query';
import type { MarketAnalytics } from '../../models/market-analytics';
import {
  enrichNamedManagers,
  enrichBuyers,
  enrichTraders,
  enrichSteals,
} from '../mappers/market-manager-enrichment.mapper';
import {
  getTopTransferredPlayer,
  getRecordTransfer,
  getBigSpender,
  getBestSeller,
  getMostOwnersPlayer,
  getManagerMarketStats,
} from './market-summary.service';
import {
  getRecordBid,
  getTheThief,
  getBiggestSteal,
  getTheVictim,
  getOverpayerManager,
  getInflatedPlayer,
} from './market-auctions.service';
import {
  getBestRevaluation,
  getBestValuePlayer,
  getInfirmaryPlayers,
  getBestSingleFlip,
  getWorstSingleFlip,
  getBestPercentageGain,
  getMissedOpportunity,
  getTopTrader,
  getProfitablePlayer,
  getLossyPlayer,
  getQuickestFlip,
  getLongestProfitableHold,
  getWorstRevaluation,
} from './market-investments.service';
import {
  getMarketOverviewKPIs,
  getPositionAnalysis,
  getBiddingDuelsStats,
} from './market-overview.service';
import { getMarketTrendsAnalysis } from '../../../trends/server/services/market-trends.service';
import { getCurrentMarketListings } from '../../../catalogue/server/services/market-catalogue.service';
export const MARKET_ANALYTICS_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
  httpMaxAgeSeconds: 300,
  httpStaleWhileRevalidateSeconds: 60,
} as const);
export async function fetchMarketStats(): Promise<MarketAnalytics> {
  const [
    kpis,
    topPlayer,
    recordTransfer,
    bigSpender,
    recordBid,
    trends,
    positionStats,
    managerStats,
    bestSeller,
    bestRevaluation,
    bestValue,
    infirmary,
    bestFlip,
    worstFlip,
    bestPercentage,
    mostOwners,
    theThief,
    biggestSteal,
    theVictim,
    overpayerManager,
    inflatedPlayer,
    biddingDuels,
    missedOpportunity,
    topTrader,
    profitablePlayer,
    lossyPlayer,
    quickestFlip,
    longestHold,
    worstRevaluation,
    currentMarketListings,
    allUsers,
  ] = await Promise.all([
    getMarketOverviewKPIs(),
    getTopTransferredPlayer(),
    getRecordTransfer(),
    getBigSpender(),
    getRecordBid(),
    getMarketTrendsAnalysis(),
    getPositionAnalysis(),
    getManagerMarketStats(),
    getBestSeller(),
    getBestRevaluation(),
    getBestValuePlayer(),
    getInfirmaryPlayers(),
    getBestSingleFlip(),
    getWorstSingleFlip(),
    getBestPercentageGain(),
    getMostOwnersPlayer(),
    getTheThief(),
    getBiggestSteal(),
    getTheVictim(),
    getOverpayerManager(),
    getInflatedPlayer(),
    getBiddingDuelsStats(),
    getMissedOpportunity(),
    getTopTrader(),
    getProfitablePlayer(),
    getLossyPlayer(),
    getQuickestFlip(),
    getLongestProfitableHold(),
    getWorstRevaluation(),
    getCurrentMarketListings(),
    getAllUsers(),
  ]);

  const enrichedBigSpender = enrichNamedManagers(bigSpender, allUsers);
  const enrichedRecordBid = enrichBuyers(recordBid, allUsers);
  const enrichedRecordTransfer = enrichBuyers(recordTransfer, allUsers);
  const enrichedBestSeller = enrichNamedManagers(bestSeller, allUsers);
  const enrichedTheThief = enrichNamedManagers(theThief, allUsers);
  const enrichedTheVictim = enrichNamedManagers(theVictim, allUsers);
  const enrichedOverpayerManager = enrichNamedManagers(overpayerManager, allUsers);
  const enrichedTopTrader = enrichTraders(topTrader, allUsers);
  const enrichedBiggestSteal = enrichSteals(biggestSteal, allUsers);
  return {
    kpis,
    topPlayer,
    recordTransfer: enrichedRecordTransfer,
    bigSpender: enrichedBigSpender,
    recordBid: enrichedRecordBid,
    trends,
    positionStats,
    managerStats, // Ya contiene user_id, user_icon, color_index
    bestSeller: enrichedBestSeller,
    bestRevaluation,
    bestValue,
    infirmary,
    bestFlip,
    worstFlip,
    bestPercentage,
    mostOwners,
    theThief: enrichedTheThief,
    biggestSteal: enrichedBiggestSteal,
    theVictim: enrichedTheVictim,
    overpayerManager: enrichedOverpayerManager,
    inflatedPlayer,
    biddingDuels,
    missedOpportunity,
    topTrader: enrichedTopTrader,
    profitablePlayer,
    lossyPlayer,
    quickestFlip,
    longestHold,
    worstRevaluation,
    currentMarketListings,
    allUsers,
  };
}
