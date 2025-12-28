/**
 * Analytics & Calculation Layer
 *
 * This file contains pure functions that process raw data from the database
 * to generate insights, format data for charts, or calculate complex metrics.
 *
 * It does NOT connect to the database directly. It receives data as arguments.
 */

/**
 * Prepares market trend data for Chart.js or similar libraries
 * Separates the data into labels (dates) and datasets (values)
 *
 * @param {Array} rawTrends - Array of objects { date, count, avg_value }
 * @returns {Object} Formatted data { labels: [], datasets: {} }
 */
export function processMarketTrendsForChart(rawTrends) {
  if (!rawTrends || rawTrends.length === 0) {
    return { labels: [], datasets: { volume: [], prices: [] } };
  }

  return {
    labels: rawTrends.map((t) => t.date),
    datasets: {
      volume: rawTrends.map((t) => t.count),
      prices: rawTrends.map((t) => t.avg_value),
    },
  };
}

/**
 * Calculates the "Market Heat" index based on activity
 * A simple algorithm to determine if the market is Hot, Neutral, or Cold
 *
 * @param {Object} kpis - The object returned by getMarketKPIs()
 * @returns {Object} { status: 'Hot'|'Neutral'|'Cold', score: 0-100 }
 */
export function calculateMarketHeat(kpis) {
  if (!kpis) return { status: 'Unknown', score: 0 };

  // Example logic:
  // Base score on active buyers vs sellers ratio and total volume
  const buyerSellerRatio = kpis.active_sellers > 0 ? kpis.active_buyers / kpis.active_sellers : 0;

  let score = 50; // Neutral start

  // More buyers than sellers = Hotter market
  if (buyerSellerRatio > 1.5) score += 20;
  if (buyerSellerRatio < 0.5) score -= 20;

  // High volume bonus (simplified logic)
  if (kpis.total_transfers > 100) score += 10;

  // Determine status label
  let status = 'Neutral';
  if (score >= 70) status = 'Hot 🔥';
  if (score <= 30) status = 'Cold ❄️';

  return { status, score };
}

/**
 * Formats a large number as currency (e.g. 1.5M €)
 * @param {number} value - The price in raw number
 * @returns {string} Formatted string
 */
export function formatMoney(value) {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M €';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k €';
  }
  return value + ' €';
}
