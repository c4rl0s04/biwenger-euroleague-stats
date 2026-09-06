export interface SearchPlayerRecord {
  id: number;
  name: string;
  img: string;
  position: string | null;
  team: string | null;
  price: string | number | null;
  points: string | number | null;
}

export interface SearchTeamRecord {
  id: number;
  name: string;
  player_count: string | number;
}

export interface SearchUserRecord {
  id: string;
  name: string;
  icon: string | null;
}

export interface SearchRecords {
  players: SearchPlayerRecord[];
  teams: SearchTeamRecord[];
  users: SearchUserRecord[];
}
