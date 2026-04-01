/**
 * Bidding Strategy Tiers
 *
 * Defines how much over (or under) market value we suggest bidding
 * based on the player's recommendation score.
 */
export const BIDDING_STRATEGIES = [
  { threshold: 90, multiplier: 1.3, label: 'Fichaje Obligatorio' },
  { threshold: 75, multiplier: 1.15, label: 'Compra Excelente' },
  { threshold: 50, multiplier: 1.05, label: 'Compra Normal' },
  { threshold: 0, multiplier: 0.95, label: 'Compra Arriesgada / Evitar' },
];

/**
 * Calculates the Suggested Target Price for a player
 *
 * @param {number} price Current market price
 * @param {number} score Recommendation score (0-100)
 * @returns {number} The suggested bid amount
 */
export function calculateTargetPrice(price, score = 0) {
  if (!price) return 0;

  // Find the appropriate strategy based on the score
  const strategy =
    BIDDING_STRATEGIES.find((s) => score >= s.threshold) ||
    BIDDING_STRATEGIES[BIDDING_STRATEGIES.length - 1];

  const rawTarget = price * strategy.multiplier;

  // Professional Rounding Logic:
  // - If price > 1M, round to nearest 10,000
  // - If price > 100k, round to nearest 1,000
  // - Otherwise, standard round
  if (rawTarget > 1000000) {
    return Math.round(rawTarget / 10000) * 10000;
  } else if (rawTarget > 100000) {
    return Math.round(rawTarget / 1000) * 1000;
  }

  return Math.round(rawTarget);
}

/**
 * Gets the strategy label for a given score
 *
 * @param {number} score Recommendation score (0-100)
 * @returns {string} The strategy label
 */
export function getStrategyLabel(score = 0) {
  const strategy = BIDDING_STRATEGIES.find((s) => score >= s.threshold);
  return strategy ? strategy.label : 'Evitar';
}
