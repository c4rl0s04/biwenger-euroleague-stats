/**
 * Analytics & Calculation Layer
 *
 * This file contains pure functions that process raw data from the database
 * to generate insights, format data for charts, or calculate complex metrics.
 *
 * It does NOT connect to the database directly. It receives data as arguments.
 */

interface RawTrend {
  date: string;
  count: number;
  avg_value: number;
}

interface ChartDatasets {
  volume: number[];
  prices: number[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDatasets;
}

/**
 * Prepares market trend data for Chart.js or similar libraries
 */
export function processMarketTrendsForChart(rawTrends: RawTrend[] | null | undefined): ChartData {
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

interface MarketKPIs {
  active_buyers: number;
  active_sellers: number;
  total_transfers: number;
  [key: string]: unknown;
}

type MarketHeatStatus = 'Hot 🔥' | 'Neutral' | 'Cold ❄️' | 'Unknown';

interface MarketHeatResult {
  status: MarketHeatStatus;
  score: number;
}

/**
 * Calculates the "Market Heat" index based on activity
 */
export function calculateMarketHeat(kpis: MarketKPIs | null | undefined): MarketHeatResult {
  if (!kpis) return { status: 'Unknown', score: 0 };

  const buyerSellerRatio = kpis.active_sellers > 0 ? kpis.active_buyers / kpis.active_sellers : 0;

  let score = 50;

  if (buyerSellerRatio > 1.5) score += 20;
  if (buyerSellerRatio < 0.5) score -= 20;

  if (kpis.total_transfers > 100) score += 10;

  let status: MarketHeatStatus = 'Neutral';
  if (score >= 70) status = 'Hot 🔥';
  if (score <= 30) status = 'Cold ❄️';

  return { status, score };
}

/**
 * Formats a large number as currency (e.g. 1.5M €)
 */
export function formatMoney(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M €';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k €';
  }
  return value + ' €';
}
