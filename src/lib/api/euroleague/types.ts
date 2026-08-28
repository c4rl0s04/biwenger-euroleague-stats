export interface EuroleagueScheduleGame {
  seasonYear: number;
  gameCode: number;
  gameId: string;
  roundNumber: number | null;
  roundCode: string | null;
  phase: string | null;
  homeTeamCode: string;
  homeTeamName: string;
  awayTeamCode: string;
  awayTeamName: string;
  scheduledAt: Date | null;
  arenaCode: string | null;
  arenaName: string | null;
  arenaCapacity: number | null;
  isDateConfirmed: boolean;
  isTimeConfirmed: boolean;
  isPlayed: boolean;
  raw: Record<string, unknown>;
}

export interface EuroleagueStanding {
  roundNumber: number;
  teamCode: string;
  teamName: string;
  crestUrl: string | null;
  position: number | null;
  gamesPlayed: number | null;
  gamesWon: number | null;
  gamesLost: number | null;
  pointsFor: number | null;
  pointsAgainst: number | null;
  raw: Record<string, unknown>;
}

export interface EuroleaguePlayerProfile {
  playerCode: string;
  playerName: string;
  teamCode: string | null;
  teamName: string | null;
  imageUrl: string | null;
  teamImageUrl: string | null;
  age: number | null;
  raw: Record<string, unknown>;
}

export interface EuroleagueGameReport {
  gameCode: number;
  roundNumber: number | null;
  phase: string | null;
  homeTeamCode: string;
  awayTeamCode: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: Date | null;
  isPlayed: boolean;
  homeCrestUrl: string | null;
  awayCrestUrl: string | null;
  raw: Record<string, unknown>;
}

export interface EuroleagueGameMetadata {
  gameCode: number;
  isLive: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeQuarterScores: number[];
  awayQuarterScores: number[];
  homeOvertime: number;
  awayOvertime: number;
  arenaName: string | null;
  arenaCapacity: number | null;
  homeCoach: string | null;
  awayCoach: string | null;
  referees: string[];
  raw: Record<string, unknown>;
}

export interface EuroleaguePlayerBoxScore {
  gameCode: number;
  playerCode: string;
  playerName: string;
  teamCode: string;
  isHome: boolean | null;
  isStarter: boolean | null;
  isPlaying: boolean | null;
  dorsal: string | null;
  minutes: string | null;
  minutesSeconds: number;
  points: number;
  twoPointsMade: number;
  twoPointsAttempted: number;
  threePointsMade: number;
  threePointsAttempted: number;
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  totalRebounds: number;
  assists: number;
  steals: number;
  turnovers: number;
  blocks: number;
  blocksAgainst: number;
  foulsCommitted: number;
  foulsReceived: number;
  valuation: number;
  plusMinus: number;
  raw: Record<string, unknown>;
}

export interface EuroleaguePlayByPlayEvent {
  gameCode: number;
  sequence: number;
  providerPlayNumber: number | null;
  period: number | null;
  minute: number | null;
  markerTime: string | null;
  playType: string | null;
  teamCode: string | null;
  playerCode: string | null;
  playerName: string | null;
  teamName: string | null;
  dorsal: string | null;
  homeScore: number | null;
  awayScore: number | null;
  comment: string | null;
  playInfo: string | null;
  raw: Record<string, unknown>;
}

export interface EuroleagueShot {
  gameCode: number;
  annotationNumber: number;
  teamCode: string | null;
  playerCode: string | null;
  playerName: string | null;
  actionId: string | null;
  action: string | null;
  points: number;
  coordinateX: number | null;
  coordinateY: number | null;
  zone: string | null;
  isFastbreak: boolean;
  isSecondChance: boolean;
  isPointsOffTurnover: boolean;
  minute: number | null;
  markerTime: string | null;
  homeScore: number | null;
  awayScore: number | null;
  occurredAt: Date | null;
  raw: Record<string, unknown>;
}

export interface EuroleagueClientMetrics {
  requests: number;
  retries: number;
  notFound: number;
  emptyResponses: number;
  status401: number;
  status429: number;
  status5xx: number;
  lastSuccessfulAt: string | null;
}

// Database and synchronization modules use "official" as a domain qualifier. These aliases keep
// that vocabulary without reintroducing a selectable provider abstraction.
export type OfficialScheduleGame = EuroleagueScheduleGame;
export type OfficialStanding = EuroleagueStanding;
export type OfficialPlayerProfile = EuroleaguePlayerProfile;
export type OfficialGameReport = EuroleagueGameReport;
export type OfficialGameMetadata = EuroleagueGameMetadata;
export type OfficialPlayerBoxScore = EuroleaguePlayerBoxScore;
export type OfficialPlayByPlayEvent = EuroleaguePlayByPlayEvent;
export type OfficialShot = EuroleagueShot;
