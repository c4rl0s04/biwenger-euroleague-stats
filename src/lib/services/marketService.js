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
  getBestPercentageGain,
  getMostOwnersPlayer,
  getTheThief,
  getBiggestSteal,
  getTheVictim,
} from '@/lib/db'; // Import all from @/lib/db wrapper

import { getAllUsers } from '@/lib/db'; // To Map user names to IDs/Icons if needed

/**
 * Get aggregated market statistics for the main dashboard
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
    bestPercentage,
    mostOwners,
    theThief,
    biggestSteal,
    theVictim,
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
    getBestPercentageGain(),
    getMostOwnersPlayer(),
    getTheThief(),
    getBiggestSteal(),
    getTheVictim(),
  ]);

  // We might want to enrich bigSpender with user Icon if we can match names
  let enrichedBigSpender = bigSpender;
  if (bigSpender) {
    const users = await getAllUsers();
    // Assuming bigSpender.name matches user.name
    const user = users.find((u) => u.name === bigSpender.name);
    if (user) {
      enrichedBigSpender = {
        ...bigSpender,
        id: user.id,
        icon: user.icon,
        color_index: user.color_index,
      };
    }
  }

  // Enrich recordBid buyer info too
  let enrichedRecordBid = recordBid;
  if (recordBid) {
    // Assuming recordBid has 'comprador' name
    const users = await getAllUsers();
    const user = users.find((u) => u.name === recordBid.comprador);
    if (user) {
      enrichedRecordBid = {
        ...recordBid,
        buyer_id: user.id,
        buyer_icon: user.icon,
        buyer_color: user.color_index,
      };
    }
  }

  // Enrich recordTransfer buyer info (Fallback if SQL join failed)
  let enrichedRecordTransfer = recordTransfer;
  if (recordTransfer && !recordTransfer.buyer_id) {
    const users = await getAllUsers();
    const user = users.find((u) => u.name === recordTransfer.comprador);
    if (user) {
      enrichedRecordTransfer = {
        ...recordTransfer,
        buyer_id: user.id,
        buyer_name: user.name,
        buyer_icon: user.icon,
        buyer_color: user.color_index,
      };
    }
  }

  // Enrich bestSeller with user info
  let enrichedBestSeller = bestSeller;
  if (bestSeller) {
    const users = await getAllUsers();
    const user = users.find((u) => u.name === bestSeller.name);
    if (user) {
      enrichedBestSeller = {
        ...bestSeller,
        id: user.id,
        icon: user.icon,
        color_index: user.color_index,
      };
    }
  }

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
    bestPercentage,
    mostOwners,
    theThief: await enrichUserStat(theThief, 'name'),
    biggestSteal: await enrichUserStat(
      await enrichUserStat(biggestSteal, 'winner', 'winner_id', 'winner_icon', 'winner_color'),
      'second_bidder_name',
      'second_bidder_id',
      'second_bidder_icon',
      'second_bidder_color'
    ),
    theVictim: await enrichUserStat(theVictim, 'name'),
    allUsers: await getAllUsers(), // Pass users to client if needed, or just strictly for enrichment here
  };
}

// Helper to avoid repetitive user lookup code
async function enrichUserStat(
  statObj,
  nameField = 'name',
  idField = 'id',
  iconField = 'icon',
  colorField = 'color_index'
) {
  if (!statObj) return null;
  const users = await getAllUsers();
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
}

/**
 * Get paginated transfers list
 */
export async function fetchLiveMarketTransfers(params) {
  return await getLiveMarketTransfers(params);
}

export { getBestValueDetails };
