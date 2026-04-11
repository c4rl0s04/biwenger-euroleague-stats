/**
 * Get color class for a score
 */
export function getScoreColor(score: number | string): string {
  if (score === 'X') return 'bg-rose-600/40 text-rose-100 border-rose-500/50';
  const s = Number(score);
  if (s >= 15) return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
  if (s >= 10) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
  if (s >= 5) return 'bg-green-500/20 text-green-300 border-green-500/30';
  if (s > 0) return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
  if (s == 0) return 'bg-slate-700/40 text-slate-300 border-slate-600/30';
  return 'bg-red-500/20 text-red-300 border-red-500/30';
}

const SHORT_TEAM_NAME_MAP: Record<string, string> = {
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
  // Sponsored Names (Euroleague API)
  'Maccabi Rapyd Tel Aviv': 'Maccabi',
  'Kosner Baskonia Vitoria-Gasteiz': 'Baskonia',
  'Panathinaikos AKTOR Athens': 'Panathinaikos',
  'Virtus Bologna': 'Virtus',
};

/**
 * Get shortened team name
 */
export function getShortTeamName(teamName: string | null | undefined): string {
  if (!teamName) return '';
  return SHORT_TEAM_NAME_MAP[teamName] ?? teamName;
}

/**
 * Get shortened round name (e.g. "Jornada 31 (aplazada)" -> "J31")
 */
export function getShortRoundName(name: string | null | undefined): string {
  if (!name) return '';
  // Support "Jornada X", "Round X", or already shortened "JX" formats
  // and strip any suffixes like "(aplazada)"
  const match = name.match(/(?:Jornada|J|Round)\s*(\d+)/i);
  return match ? `J${match[1]}` : name;
}
