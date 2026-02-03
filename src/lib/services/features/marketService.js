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
} from '@/lib/db';

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

export async function fetchRecentTransfers(limit = 20) {
  return await getRecentTransfers(limit);
}

export async function fetchMarketOpportunities(limit = 6) {
  return await getMarketOpportunities(limit);
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get full market data for market page
 * @returns {Promise<Object>} Complete market data
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

/**
 * Get market activity feed
 * @param {Object} options - Options
 * @param {number} [options.limit=20] - Result limit
 * @returns {Promise<Array>} Market activity
 */
export async function getMarketActivity(options = {}) {
  const { limit = 20 } = options;
  return await getRecentTransfers(limit);
}
