/** Public search projection, not a player profile or account record. */
export interface SearchPlayer {
  id: number;
  name: string;
  img: string;
  position: string | null;
  team: string | null;
  /** Legacy parseInt semantics: non-numeric values serialize as JSON null. */
  price: number;
  points: number;
}

export interface SearchTeam {
  id: number;
  name: string;
  player_count: number;
}

export interface SearchUser {
  id: string;
  name: string;
  icon: string | null;
}

export interface GlobalSearchResult {
  players: SearchPlayer[];
  teams: SearchTeam[];
  users: SearchUser[];
}

export function emptySearchResult(): GlobalSearchResult {
  return { players: [], teams: [], users: [] };
}
