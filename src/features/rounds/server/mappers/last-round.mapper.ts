import type { LastRoundMVP, LastRoundStats, HighestRoundRecord } from '../../models/last-round';

export const mapLastRoundMVP = (row: LastRoundMVP): LastRoundMVP => ({
  player_id: row.player_id,
  name: row.name,
  team: row.team,
  position: row.position,
  points: row.points,
  owner_name: row.owner_name,
  owner_color_index: row.owner_color_index,
});
export const mapLastRoundStats = (row: LastRoundStats): LastRoundStats => ({
  player_id: row.player_id,
  name: row.name,
  team: row.team,
  position: row.position,
  price: row.price,
  points: row.points,
  owner_name: row.owner_name,
  round_name: row.round_name,
});
export const mapHighestRound = (row: HighestRoundRecord): HighestRoundRecord => ({
  user_name: row.user_name,
  round_name: row.round_name,
  points: row.points,
});
