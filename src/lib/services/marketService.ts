import 'server-only';
import {
  getCurrentMarketListings,
  getLiveMarketTransfers,
  getMarketTrendsAnalysis as getMarketTrendsAnalysisQuery,
  getBestValueDetails as getBestValueDetailsQuery,
  getBiddingDuelDetails,
} from '@/features/market/server';

export { fetchMarketStats } from '@/features/market/server';

export async function fetchCurrentMarketListings() {
  return await getCurrentMarketListings();
}

export interface LiveMarketTransfersParams {
  page?: number;
  limit?: number;
  buyer?: string;
  seller?: string;
}

export async function fetchLiveMarketTransfers(params: LiveMarketTransfersParams = {}) {
  return await getLiveMarketTransfers(params);
}

export async function fetchMarketTrendsAnalysis(days: number) {
  return await getMarketTrendsAnalysisQuery(days);
}

export async function fetchBestValueDetails(transferId: number) {
  return await getBestValueDetailsQuery(transferId);
}

export async function fetchBiddingDuelDetails(userId: number, opponentId: number) {
  return await getBiddingDuelDetails(userId, opponentId);
}
