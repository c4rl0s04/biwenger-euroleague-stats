/**
 * Centralized configuration constants for thresholds and limits
 * Prevents magic numbers scattered throughout the codebase
 */

// Season configuration
export const SEASON = {
  TOTAL_ROUNDS: 38, // Full Euroleague season rounds
  MAX_FETCH_ROUNDS: 38, // Buffer for postponed rounds
};

// Streak & Performance thresholds
export const THRESHOLDS = {
  HIGH_SCORE_ROUND: 175, // Points considered "high performing" round
  GOOD_AVERAGE: 150, // Average considered "good"
  POOR_ROUND: 100, // Points considered a bad round
  STREAK_IMPROVEMENT_PCT: 20, // % improvement to be considered "on fire"
};

// API & Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  TRANSFERS_LIMIT: 100,
  SYNC_BATCH_SIZE: 50,
  TOP_PLAYERS_LIMIT: 10,
  ROUND_WINNERS_LIMIT: 15,
  RECENT_ROUNDS: 5, // Number of recent rounds for trends
  MARKET_LIMIT: 50, // Default market activity limit
};

// ROI coloring thresholds (percentage)
export const ROI_THRESHOLDS = {
  EXCELLENT: 80, // >= 80% = green
  GOOD: 60, // >= 60% = amber
  // < 60% = red
};

// Position mappings (from Biwenger API)
export const POSITIONS = {
  1: 'Base',
  2: 'Alero',
  3: 'Pivot',
  4: 'Entrenador',
  5: 'Entrenador',
};

// UI Animation & Display constants
export const UI = {
  // Animation timings (ms)
  FADE_DELAY_INCREMENT: 100, // Delay between staggered fade-ins
  TOOLTIP_DELAY: 300, // Tooltip appearance delay
  TRANSITION_DURATION: 300, // Default transition duration

  // Chart dimensions
  CHART_HEIGHT: 500, // Default chart height in px
  CHART_MARGIN: { top: 10, right: 30, left: 0, bottom: 0 },

  // Avatar sizes
  AVATAR_SIZES: {
    SM: 20,
    MD: 24,
    LG: 32,
    XL: 40,
  },
};

// Score color thresholds (for individual game scores)
export const SCORE_COLORS = {
  EXCELLENT: 25, // >= 25 = green/excellent
  GOOD: 15, // >= 15 = blue/good
  AVERAGE: 5, // >= 5 = yellow/average
  // < 5 = red/poor
};
