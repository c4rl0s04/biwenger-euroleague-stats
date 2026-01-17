/**
 * Calculates Biwenger Fantasy Points based on Euroleague Stats.
 *
 * Rules:
 * - Point scored: +1
 * - Missed 2FG: -0.3
 * - Missed 3FG: -0.5
 * - Missed FT: -0.5
 * - Assists: +1.5
 * - Rebounds: +1.2
 * - Steals: +2
 * - Turnovers: -2
 * - Blocks: +2
 *
 * Result is rounded to nearest integer.
 *
 * @param {Object} stats - Stats object
 * @param {number} stats.points
 * @param {number} stats.two_points_made
 * @param {number} stats.two_points_attempted
 * @param {number} stats.three_points_made
 * @param {number} stats.three_points_attempted
 * @param {number} stats.free_throws_made
 * @param {number} stats.free_throws_attempted
 * @param {number} stats.assists
 * @param {number} stats.rebounds
 * @param {number} stats.steals
 * @param {number} stats.turnovers
 * @param {number} stats.blocks
 * @returns {number} Calculated fantasy points
 */
export function calculateBiwengerPoints(stats) {
  if (!stats) return 0;

  let score = 0;

  // Points scored (+1)
  score += (stats.points || 0) * 1;

  // Missed 2FG (-0.3)
  const missed2 = (stats.two_points_attempted || 0) - (stats.two_points_made || 0);
  score += missed2 * -0.3;

  // Missed 3FG (-0.5)
  const missed3 = (stats.three_points_attempted || 0) - (stats.three_points_made || 0);
  score += missed3 * -0.5;

  // Missed FT (-0.5)
  const missedFT = (stats.free_throws_attempted || 0) - (stats.free_throws_made || 0);
  score += missedFT * -0.5;

  // Assists (+1.5)
  score += (stats.assists || 0) * 1.5;

  // Rebounds (+1.2)
  score += (stats.rebounds || 0) * 1.2;

  // Steals (+2)
  score += (stats.steals || 0) * 2;

  // Turnovers (-2)
  score += (stats.turnovers || 0) * -2;

  // Blocks (+2)
  score += (stats.blocks || 0) * 2;

  // Round UP for Biwenger consistency
  return Math.ceil(score);
}
