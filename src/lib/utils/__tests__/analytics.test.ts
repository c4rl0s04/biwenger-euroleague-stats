import { describe, it, expect } from 'vitest';
import {
  processMarketTrendsForChart,
  calculateMarketHeat,
  formatMoney,
} from '@/lib/utils/analytics';

describe('processMarketTrendsForChart', () => {
  it('returns empty structure when input is null', () => {
    expect(processMarketTrendsForChart(null)).toEqual({
      labels: [],
      datasets: { volume: [], prices: [] },
    });
  });

  it('returns empty structure when input is undefined', () => {
    expect(processMarketTrendsForChart(undefined)).toEqual({
      labels: [],
      datasets: { volume: [], prices: [] },
    });
  });

  it('returns empty structure for empty array', () => {
    expect(processMarketTrendsForChart([])).toEqual({
      labels: [],
      datasets: { volume: [], prices: [] },
    });
  });

  it('maps raw trends to chart data correctly', () => {
    const rawTrends = [
      { date: '2025-01-01', count: 5, avg_value: 100000 },
      { date: '2025-01-02', count: 10, avg_value: 200000 },
    ];
    const result = processMarketTrendsForChart(rawTrends);
    expect(result.labels).toEqual(['2025-01-01', '2025-01-02']);
    expect(result.datasets.volume).toEqual([5, 10]);
    expect(result.datasets.prices).toEqual([100000, 200000]);
  });
});

describe('calculateMarketHeat', () => {
  it('returns Unknown when input is null', () => {
    const result = calculateMarketHeat(null);
    expect(result.status).toBe('Unknown');
    expect(result.score).toBe(0);
  });

  it('returns Unknown when input is undefined', () => {
    expect(calculateMarketHeat(undefined).status).toBe('Unknown');
  });

  it('returns Hot when buyers greatly outnumber sellers and high transfers', () => {
    const result = calculateMarketHeat({
      active_buyers: 20,
      active_sellers: 5,
      total_transfers: 150,
    });
    expect(result.status).toBe('Hot 🔥');
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('returns Cold when sellers greatly outnumber buyers', () => {
    const result = calculateMarketHeat({
      active_buyers: 2,
      active_sellers: 20,
      total_transfers: 5,
    });
    expect(result.status).toBe('Cold ❄️');
    expect(result.score).toBeLessThanOrEqual(30);
  });

  it('returns Neutral for balanced market', () => {
    const result = calculateMarketHeat({
      active_buyers: 10,
      active_sellers: 10,
      total_transfers: 50,
    });
    expect(result.status).toBe('Neutral');
  });

  it('handles zero sellers gracefully (no division by zero)', () => {
    const result = calculateMarketHeat({
      active_buyers: 5,
      active_sellers: 0,
      total_transfers: 50,
    });
    expect(result.score).toBeDefined();
  });
});

describe('formatMoney', () => {
  it('formats millions correctly', () => {
    expect(formatMoney(1500000)).toBe('1.5M €');
  });

  it('formats thousands correctly', () => {
    expect(formatMoney(50000)).toBe('50k €');
  });

  it('formats values below 1000 as plain number', () => {
    expect(formatMoney(500)).toBe('500 €');
  });

  it('formats exactly 1 million', () => {
    expect(formatMoney(1000000)).toBe('1.0M €');
  });

  it('formats exactly 1000', () => {
    expect(formatMoney(1000)).toBe('1k €');
  });
});
