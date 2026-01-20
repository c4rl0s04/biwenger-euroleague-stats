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

export function getTeamColor(teamCode) {
  if (!teamCode) return DEFAULT_TEAM_COLOR;
  return TEAM_COLORS[teamCode.toUpperCase()] || DEFAULT_TEAM_COLOR;
}
