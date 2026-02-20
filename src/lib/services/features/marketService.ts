import 'server-only';

/**
 * Market Service
 * Business logic layer for market-related operations
 *
 * @fileoverview Aggregates market data from multiple queries
 */

import {
  getMarketKPIs,
  getAllTransfers,
  getMarketTrends,
  getRecentTransfers,
  getMarketOpportunities,
} from '../../db';

// ============ DIRECT WRAPPERS ============

export async function fetchMarketKPIs() {
  return await getMarketKPIs();
}

export async function fetchAllTransfers() {
  return await getAllTransfers();
}

export async function fetchMarketTrends() {
  return await getMarketTrends();
}

export async function fetchRecentTransfers(limit: number = 20) {
  return await getRecentTransfers(limit);
}

export async function fetchMarketOpportunities(limit: number = 6) {
  return await getMarketOpportunities(limit);
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get full market data for market page
 * @returns Complete market data
 */
export async function getMarketPageData() {
  const [kpis, transfers, trends] = await Promise.all([
    getMarketKPIs(),
    getAllTransfers(),
    getMarketTrends(),
  ]);

  return {
    kpis,
    transfers,
    trends,
  };
}

export interface MarketActivityOptions {
  limit?: number;
}

/**
 * Get market activity feed
 * @param options - Options
 * @returns Market activity
 */
export async function getMarketActivity(options: MarketActivityOptions = {}) {
  const { limit = 20 } = options;
  return await getRecentTransfers(limit);
}
