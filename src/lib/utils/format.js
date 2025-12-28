/**
 * Get color class for a score
 * @param {number|string} score - The score to evaluate
 * @returns {string} Tailwind CSS classes for the score badge
 */
export function getScoreColor(score) {
  const s = Number(score);
  if (s >= 10) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (s >= 5) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (s > 0) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  if (s == 0) return 'bg-grey-500/20 text-grey-300 border-grey-500/30';
  if (s >= -10) return 'bg-red-500/20 text-red-300 border-red-500/30';
  return 'bg-slate-700/50 text-slate-400 border-slate-600/30';
}

/**
 * Get shortened team name
 * @param {string} teamName - Full team name
 * @returns {string} Shortened team name
 */
export function getShortTeamName(teamName) {
  if (!teamName) return '';

  const map = {
    'Real Madrid': 'R. Madrid',
    'FC Barcelona': 'Barça',
    'Baskonia Vitoria-Gasteiz': 'Baskonia',
    'Valencia Basket': 'Valencia',
    'Olympiacos Piraeus': 'Olympiacos',
    'Panathinaikos Athens': 'Panathinaikos',
    'Fenerbahce Beko Istanbul': 'Fenerbahce',
    'Anadolu Efes Istanbul': 'Anadolu Efes',
    'AS Monaco': 'Monaco',
    'Maccabi Playtika Tel Aviv': 'Maccabi',
    'Partizan Mozzart Bet Belgrade': 'Partizan',
    'Crvena Zvezda Meridianbet Belgrade': 'Crvena Zvezda',
    'EA7 Emporio Armani Milan': 'Milano',
    'Virtus Segafredo Bologna': 'Virtus',
    'Zalgiris Kaunas': 'Zalgiris',
    'FC Bayern Munich': 'Bayern',
    'LDLC ASVEL Villeurbanne': 'ASVEL',
    'Paris Basketball': 'Paris',
    'Dubai Basketball': 'Dubai',
    'Hapoel IBI Tel Aviv': 'Hapoel',
  };

  return map[teamName] || teamName;
}
