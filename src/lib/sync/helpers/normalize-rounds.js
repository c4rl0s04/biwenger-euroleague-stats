/**
 * Round Normalization Helpers
 * Utilities for handling round name normalization (e.g., postponed matches)
 */

/**
 * Normalizes round names by removing postponement markers
 * @param {string} name - Round name (e.g., "Jornada 5 (aplazada)")
 * @returns {string} Cleaned round name (e.g., "Jornada 5")
 */
export function normalizeRoundName(name) {
  if (!name) return '';
  return name.replace(' (aplazada)', '').trim();
}

/**
 * Builds a map of base round names to their canonical (lowest) IDs
 * This maps postponed rounds to their original round ID
 * 
 * @param {Array<{id: number, name: string}>} rounds - List of round objects
 * @returns {Object<string, number>} Map of baseName -> lowestId
 * 
 * @example
 * // Input: [{id: 5, name: "Jornada 5"}, {id: 25, name: "Jornada 5 (aplazada)"}]
 * // Output: {"Jornada 5": 5}
 */
export function buildRoundNameMap(rounds) {
  const map = {};
  
  for (const r of rounds) {
    const baseName = normalizeRoundName(r.name);
    
    // Store the lowest ID for each base name (canonical)
    if (!map[baseName] || r.id < map[baseName]) {
      map[baseName] = r.id;
    }
  }
  
  return map;
}

/**
 * Gets the canonical round ID for a given round
 * Returns the original round's ID if this is a postponed match
 * 
 * @param {Object} round - Round object with id and name
 * @param {Object} roundNameMap - Map from buildRoundNameMap
 * @returns {number} Canonical round ID
 */
export function getCanonicalRoundId(round, roundNameMap) {
  const baseName = normalizeRoundName(round.name);
  return roundNameMap[baseName] || round.id;
}
