/** Historical tournament snapshots have heterogeneous JSON contracts. Preserve
 * their complete JSON value until their presentation-specific models migrate. */
export type TournamentJson =
  | null
  | boolean
  | number
  | string
  | TournamentJson[]
  | { [key: string]: TournamentJson };

export interface Tournament {
  id: number;
  name: string | null;
  type: string | null;
  status: string | null;
  data_json: string | null;
  data: TournamentJson;
}

export interface TournamentStanding {
  id: number;
  season_id: string;
  tournament_id: number | null;
  phase_name: string | null;
  group_name: string | null;
  user_id: string | null;
  position: number | null;
  points: number | null;
  won: number | null;
  lost: number | null;
  drawn: number | null;
  scored: number | null;
  against: number | null;
  user_name: string | null;
  user_icon: string | null;
  user_color: number | null;
}

export interface TournamentFixture {
  id: number;
  tournament_id: number | null;
  phase_id: number | null;
  round_name: string | null;
  round_id: number | null;
  group_name: string | null;
  home_user_id: string | null;
  away_user_id: string | null;
  home_score: number | null;
  away_score: number | null;
  date: number | null;
  status: string | null;
  phase_name: string | null;
  phase_type: string | null;
  home_user_name: string | null;
  home_user_icon: string | null;
  home_user_color: number | null;
  away_user_name: string | null;
  away_user_icon: string | null;
  away_user_color: number | null;
}

export interface ManagerTournamentRead {
  tournament_id: number;
  tournament_name: string | null;
  tournament_type: string | null;
  tournament_status: string | null;
  // PostgreSQL stores text; the legacy participation mapper also accepts parsed JSON.
  data_json: TournamentJson;
  position: number | null;
  points: number | null;
  won: number;
  drawn: number;
  lost: number;
  phase_name: string | null;
  group_name: string | null;
}

export interface ManagerTournamentParticipation extends Omit<
  ManagerTournamentRead,
  'data_json' | 'phase_name'
> {
  // Valid JSON types are described here. Legacy prototype-key phase types can
  // produce inherited values outside this contract; that behavior is not tightened.
  phase_name: TournamentJson | undefined;
}
