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

export function fetchMarketKPIs() {
  return getMarketKPIs();
}

export function fetchAllTransfers() {
  return getAllTransfers();
}

export function fetchMarketTrends() {
  return getMarketTrends();
}

export function fetchRecentTransfers(limit = 20) {
  return getRecentTransfers(limit);
}

export function fetchMarketOpportunities(limit = 6) {
  return getMarketOpportunities(limit);
}

// ============ AGGREGATED FUNCTIONS ============

/**
 * Get full market data for market page
 * @returns {Object} Complete market data
 */
export function getMarketPageData() {
  return {
    kpis: getMarketKPIs(),
    transfers: getAllTransfers(),
    trends: getMarketTrends(),
  };
}

/**
 * Get market activity feed
 * @param {Object} options - Options
 * @param {number} [options.limit=20] - Result limit
 * @returns {Array} Market activity
 */
export function getMarketActivity(options = {}) {
  const { limit = 20 } = options;
  return getRecentTransfers(limit);
}
