/**
 * Centralized configuration constants for thresholds and limits
 * Prevents magic numbers scattered throughout the codebase
 */

// Season configuration
export const SEASON = {
  TOTAL_ROUNDS: 38,           // Full Euroleague season rounds
  MAX_FETCH_ROUNDS: 38,       // Buffer for postponed rounds
};

// Streak & Performance thresholds
export const THRESHOLDS = {
  HIGH_SCORE_ROUND: 175,      // Points considered "high performing" round
  GOOD_AVERAGE: 150,          // Average considered "good"
  POOR_ROUND: 100,            // Points considered a bad round
};

// API & Pagination defaults
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  TRANSFERS_LIMIT: 100,
  SYNC_BATCH_SIZE: 50,
  TOP_PLAYERS_LIMIT: 10,
  ROUND_WINNERS_LIMIT: 15,
};

// ROI coloring thresholds (percentage)
export const ROI_THRESHOLDS = {
  EXCELLENT: 80,  // >= 80% = green
  GOOD: 60,       // >= 60% = amber
  // < 60% = red
};

// Position mappings (from Biwenger API)
export const POSITIONS = {
  1: 'Base',
  2: 'Alero',
  3: 'Pivot',
  4: 'Entrenador',
  5: 'Entrenador'
};
