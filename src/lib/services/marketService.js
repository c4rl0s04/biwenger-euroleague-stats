import {
  getMarketOverviewKPIs,
  getTopTransferredPlayer,
  getRecordTransfer,
  getBigSpender,
  getRecordBid,
  getMarketTrendsAnalysis,
  getPositionAnalysis,
  getLiveMarketTransfers,
  getManagerMarketStats,
  getBestSeller,
  getBestRevaluation,
  getBestValuePlayer,
  getBestValueDetails,
  getWorstValuePlayer,
  getBestSingleFlip,
  getWorstSingleFlip,
  getBestPercentageGain,
  getMostOwnersPlayer,
  getTheThief,
  getBiggestSteal,
  getTheVictim,
  getMissedOpportunity,
  getTopTrader,
  getProfitablePlayer,
  getLossyPlayer,
  getQuickestFlip,
  getLongestProfitableHold,
  getWorstRevaluation,
} from '@/lib/db'; // Import all from @/lib/db wrapper

import { getAllUsers } from '@/lib/db'; // To Map user names to IDs/Icons if needed

/**
 * Get aggregated market statistics for the main dashboard
 * All stat queries now return arrays of top 10 results
 */
export async function fetchMarketStats() {
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
    worstValue,
    bestFlip,
    worstFlip,
    bestPercentage,
    mostOwners,
    theThief,
    biggestSteal,
    theVictim,
    missedOpportunity,
    topTrader,
    profitablePlayer,
    lossyPlayer,
    quickestFlip,
    longestHold,
    worstRevaluation,
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
    getWorstValuePlayer(),
    getBestSingleFlip(),
    getWorstSingleFlip(),
    getBestPercentageGain(),
    getMostOwnersPlayer(),
    getTheThief(),
    getBiggestSteal(),
    getTheVictim(),
    getMissedOpportunity(),
    getTopTrader(),
    getProfitablePlayer(),
    getLossyPlayer(),
    getQuickestFlip(),
    getLongestProfitableHold(),
    getWorstRevaluation(),
    getAllUsers(),
  ]);

  // Enrich arrays with user info
  const enrichedBigSpender = enrichUserArray(bigSpender, allUsers, 'name');
  const enrichedRecordBid = enrichUserArray(
    recordBid,
    allUsers,
    'comprador',
    'buyer_id',
    'buyer_icon',
    'buyer_color'
  );
  const enrichedRecordTransfer = enrichUserArray(
    recordTransfer,
    allUsers,
    'comprador',
    'buyer_id',
    'buyer_icon',
    'buyer_color'
  );
  const enrichedBestSeller = enrichUserArray(bestSeller, allUsers, 'name');
  const enrichedTheThief = enrichUserArray(theThief, allUsers, 'name');
  const enrichedTheVictim = enrichUserArray(theVictim, allUsers, 'name');

  // BiggestSteal needs double enrichment (winner + second bidder)
  const enrichedBiggestSteal = enrichUserArray(
    enrichUserArray(biggestSteal, allUsers, 'winner', 'winner_id', 'winner_icon', 'winner_color'),
    allUsers,
    'second_bidder_name',
    'second_bidder_id',
    'second_bidder_icon',
    'second_bidder_color'
  );

  return {
    kpis,
    topPlayer,
    recordTransfer: enrichedRecordTransfer,
    bigSpender: enrichedBigSpender,
    recordBid: enrichedRecordBid,
    trends,
    positionStats,
    managerStats,
    bestSeller: enrichedBestSeller,
    bestRevaluation,
    bestValue,
    worstValue,
    bestFlip,
    worstFlip,
    bestPercentage,
    mostOwners,
    theThief: enrichedTheThief,
    biggestSteal: enrichedBiggestSteal,
    theVictim: enrichedTheVictim,
    missedOpportunity,
    topTrader,
    profitablePlayer,
    lossyPlayer,
    quickestFlip,
    longestHold,
    worstRevaluation,
    allUsers,
  };
}

/**
 * Helper to enrich an array of stats with user info
 * @param {Array} statArray - Array of stat objects
 * @param {Array} users - Array of all users
 * @param {string} nameField - Field containing the user name to match
 * @param {string} idField - Field name for user ID output
 * @param {string} iconField - Field name for user icon output
 * @param {string} colorField - Field name for user color output
 */
function enrichUserArray(
  statArray,
  users,
  nameField = 'name',
  idField = 'id',
  iconField = 'icon',
  colorField = 'color_index'
) {
  if (!Array.isArray(statArray) || !statArray.length) return [];

  return statArray.map((statObj) => {
    const user = users.find((u) => u.name === statObj[nameField]);
    if (user) {
      return {
        ...statObj,
        [idField]: user.id,
        [iconField]: user.icon,
        [colorField]: user.color_index,
      };
    }
    return statObj;
  });
}

/**
 * Get paginated transfers list
 */
export async function fetchLiveMarketTransfers(params) {
  return await getLiveMarketTransfers(params);
}

export { getBestValueDetails };
