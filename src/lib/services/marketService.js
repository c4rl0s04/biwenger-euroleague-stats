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
  getTransfersByUser,
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

export function fetchTransfersByUser(userId) {
  return getTransfersByUser(userId);
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
 * @param {string} [options.userId] - Filter by user
 * @param {number} [options.limit=20] - Result limit
 * @returns {Object} Market activity
 */
export function getMarketActivity(options = {}) {
  const { userId, limit = 20 } = options;

  if (userId) {
    return getTransfersByUser(userId);
  }

  return getRecentTransfers(limit);
}
