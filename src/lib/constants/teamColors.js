// Euroleague Team Colors
export const TEAM_COLORS = {
  RMA: '#FEBE10', // Real Madrid (Gold)
  MAD: '#FEBE10', // Real Madrid (DB Code)
  BAR: '#ED2939', // Barcelona (Red)
  BSK: '#B40039', // Baskonia (Red/Crimson)
  BAS: '#B40039', // Baskonia (DB Code)
  VAL: '#F39200', // Valencia (Orange)
  PAM: '#F39200', // Valencia (DB Code)
  OLY: '#E2001A', // Olympiacos (Red)
  PAO: '#007934', // Panathinaikos (Green)
  PAN: '#007934', // Panathinaikos (DB Code)
  FEN: '#F0C405', // Fenerbahce (Yellow)
  ULK: '#F0C405', // Fenerbahce (DB Code)
  EFS: '#2249AB', // Anadolu Efes (Blue)
  EFE: '#2249AB', // Anadolu Efes (Alt code)
  IST: '#2249AB', // Anadolu Efes (DB Code)
  MON: '#E31B23', // Monaco (Red)
  MCO: '#E31B23', // Monaco (DB Code)
  MTA: '#F9D308', // Maccabi (Yellow)
  TEL: '#F9D308', // Maccabi (DB Code)
  PAR: '#E4E4E7', // Partizan (Black/White - using Light Gray for visibility)
  ZAL: '#006737', // Zalgiris (Green)
  EA7: '#DA291C', // Milano (Red)
  MIL: '#DA291C', // Milano (Alt)
  VIR: '#E4E4E7', // Virtus (Black/White - using Light Gray for visibility)
  BAY: '#DC052D', // Bayern (Red)
  MUN: '#DC052D', // Bayern (DB Code)
  ALB: '#FFCD00', // Alba (Yellow)
  ASV: '#E4E4E7', // Asvel (Black/White - using Light Gray for visibility)
  CZV: '#E31B23', // Crvena Zvezda (Red)
  RED: '#E31B23', // Crvena Zvezda (DB Code)
  PRS: '#27C4F3', // Paris (Light Blue/Teal)
  DUB: '#8B4513', // Dubai (Brown)
  HTA: '#D41010', // Hapoel Tel Aviv (Red)
};

export const DEFAULT_TEAM_COLOR = '#A1A1AA'; // Zinc-400

const NAME_MAP = {
  'REAL MADRID': 'RMA',
  BARCELONA: 'BAR',
  'FC BARCELONA': 'BAR',
  BASKONIA: 'BSK',
  VALENCIA: 'VAL',
  OLYMPIACOS: 'OLY',
  PANATHINAIKOS: 'PAO',
  FENERBAHCE: 'FEN',
  'ANADOLU EFES': 'EFS',
  MONACO: 'MON',
  MACCABI: 'MTA',
  PARTIZAN: 'PAR',
  ZALGIRIS: 'ZAL',
  MILANO: 'EA7',
  VIRTUS: 'VIR',
  BAYERN: 'BAY',
  ALBA: 'ALB',
  ASVEL: 'ASV',
  'ESTRELLA ROJA': 'CZV',
  'CRVENA ZVEZDA': 'CZV',
  PARIS: 'PRS',
  DUBAI: 'DUB',
};

/**
 * Get the brand color for a team based on code or name
 */
export function getTeamColor(identifier) {
  if (!identifier) return DEFAULT_TEAM_COLOR;

  const upper = identifier.toUpperCase();

  // 1. Direct match (Code or Name as key)
  if (TEAM_COLORS[upper]) return TEAM_COLORS[upper];

  // 2. Name mapping (Matches Real Madrid -> RMA)
  for (const [key, code] of Object.entries(NAME_MAP)) {
    if (upper.includes(key)) return TEAM_COLORS[code];
  }

  // 3. Final Deterministic Hash Fallback (for unknown teams)
  const fallbackColors = [
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
    '#84cc16',
    '#a855f7',
    '#ef4444',
    '#3b82f6',
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length];
}
