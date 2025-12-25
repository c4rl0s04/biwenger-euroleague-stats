/**
 * Tests for thresholds.js constants
 * Ensures all configuration constants are properly defined
 */
import { describe, it, expect } from 'vitest';
import {
  SEASON,
  THRESHOLDS,
  PAGINATION,
  ROI_THRESHOLDS,
  POSITIONS,
  UI,
  SCORE_COLORS,
} from '../thresholds.js';

describe('SEASON constants', () => {
  it('should have correct Euroleague season configuration', () => {
    expect(SEASON.TOTAL_ROUNDS).toBe(38);
    expect(SEASON.MAX_FETCH_ROUNDS).toBe(38);
  });
});

describe('THRESHOLDS constants', () => {
  it('should have performance thresholds', () => {
    expect(THRESHOLDS.HIGH_SCORE_ROUND).toBe(175);
    expect(THRESHOLDS.GOOD_AVERAGE).toBe(150);
    expect(THRESHOLDS.POOR_ROUND).toBe(100);
    expect(THRESHOLDS.STREAK_IMPROVEMENT_PCT).toBe(20);
  });

  it('should have logical ordering (high > good > poor)', () => {
    expect(THRESHOLDS.HIGH_SCORE_ROUND).toBeGreaterThan(THRESHOLDS.GOOD_AVERAGE);
    expect(THRESHOLDS.GOOD_AVERAGE).toBeGreaterThan(THRESHOLDS.POOR_ROUND);
  });
});

describe('PAGINATION constants', () => {
  it('should have all pagination limits', () => {
    expect(PAGINATION.DEFAULT_LIMIT).toBe(20);
    expect(PAGINATION.TRANSFERS_LIMIT).toBe(100);
    expect(PAGINATION.SYNC_BATCH_SIZE).toBe(50);
    expect(PAGINATION.TOP_PLAYERS_LIMIT).toBe(10);
    expect(PAGINATION.ROUND_WINNERS_LIMIT).toBe(15);
    expect(PAGINATION.RECENT_ROUNDS).toBe(5);
    expect(PAGINATION.MARKET_LIMIT).toBe(50);
  });

  it('should have positive values for all limits', () => {
    Object.values(PAGINATION).forEach((value) => {
      expect(value).toBeGreaterThan(0);
    });
  });
});

describe('ROI_THRESHOLDS constants', () => {
  it('should have percentage thresholds', () => {
    expect(ROI_THRESHOLDS.EXCELLENT).toBe(80);
    expect(ROI_THRESHOLDS.GOOD).toBe(60);
  });

  it('should have logical ordering (excellent > good)', () => {
    expect(ROI_THRESHOLDS.EXCELLENT).toBeGreaterThan(ROI_THRESHOLDS.GOOD);
  });
});

describe('POSITIONS mapping', () => {
  it('should map Biwenger position IDs to names', () => {
    expect(POSITIONS[1]).toBe('Base');
    expect(POSITIONS[2]).toBe('Alero');
    expect(POSITIONS[3]).toBe('Pivot');
    expect(POSITIONS[4]).toBe('Entrenador');
    expect(POSITIONS[5]).toBe('Entrenador');
  });

  it('should have all positions 1-5 defined', () => {
    for (let i = 1; i <= 5; i++) {
      expect(POSITIONS[i]).toBeDefined();
      expect(typeof POSITIONS[i]).toBe('string');
    }
  });
});

describe('UI constants', () => {
  it('should have animation timing constants', () => {
    expect(UI.FADE_DELAY_INCREMENT).toBe(100);
    expect(UI.TOOLTIP_DELAY).toBe(300);
    expect(UI.TRANSITION_DURATION).toBe(300);
  });

  it('should have chart dimensions', () => {
    expect(UI.CHART_HEIGHT).toBe(500);
    expect(UI.CHART_MARGIN).toBeDefined();
    expect(UI.CHART_MARGIN.top).toBe(10);
    expect(UI.CHART_MARGIN.right).toBe(30);
  });

  it('should have avatar size presets', () => {
    expect(UI.AVATAR_SIZES.SM).toBe(20);
    expect(UI.AVATAR_SIZES.MD).toBe(24);
    expect(UI.AVATAR_SIZES.LG).toBe(32);
    expect(UI.AVATAR_SIZES.XL).toBe(40);
  });

  it('should have increasing avatar sizes', () => {
    expect(UI.AVATAR_SIZES.SM).toBeLessThan(UI.AVATAR_SIZES.MD);
    expect(UI.AVATAR_SIZES.MD).toBeLessThan(UI.AVATAR_SIZES.LG);
    expect(UI.AVATAR_SIZES.LG).toBeLessThan(UI.AVATAR_SIZES.XL);
  });
});

describe('SCORE_COLORS thresholds', () => {
  it('should have score color thresholds', () => {
    expect(SCORE_COLORS.EXCELLENT).toBe(25);
    expect(SCORE_COLORS.GOOD).toBe(15);
    expect(SCORE_COLORS.AVERAGE).toBe(5);
  });

  it('should have logical ordering (excellent > good > average)', () => {
    expect(SCORE_COLORS.EXCELLENT).toBeGreaterThan(SCORE_COLORS.GOOD);
    expect(SCORE_COLORS.GOOD).toBeGreaterThan(SCORE_COLORS.AVERAGE);
  });
});
