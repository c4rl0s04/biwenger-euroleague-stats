import type {
  ManagerSeasonStatsViewModel,
  ManagerSquadPlayerViewModel,
  ManagerSquadViewModel,
  ManagerRoundsViewModel,
  ManagerTransferViewModel,
} from '../../models/manager-reads';
import type {
  ManagerSeasonRecords,
  ManagerSquadRecord,
  ManagerTransferRecord,
} from '../queries/manager.records';
const integer = (value: unknown) => parseInt(String(value)) || 0;
const decimal = (value: unknown) => parseFloat(String(value)) || 0;
export interface ManagerStanding {
  user_id: string | number;
  position: number;
  team_value: string | number;
  price_trend: number;
}
export function mapManagerTransfer(row: ManagerTransferRecord): ManagerTransferViewModel {
  return {
    player_id: row.player_id,
    player_name: row.player_name,
    price: row.price,
    comprador: row.comprador,
    vendedor: row.vendedor,
    fecha: row.fecha instanceof Date ? row.fecha.toJSON() : row.fecha,
    type: row.type,
  };
}
export function mapManagerSeasonStats(
  userId: string | number,
  records: ManagerSeasonRecords,
  userStanding?: ManagerStanding
): ManagerSeasonStatsViewModel {
  const { user, stats, positions, transfers } = records;
  return {
    id: String(userId),
    name: user?.name || 'Desconocido',
    icon: user?.icon || '',
    color_index: user?.color_index ?? 0,

    // Stats Parsing
    total_points: integer(stats?.total_points) || 0,
    best_round: integer(stats?.best_round) || 0,
    worst_round: integer(stats?.worst_round) || 0,
    average_points: decimal(stats?.average_points) || 0,
    rounds_played: integer(stats?.rounds_played) || 0,

    // Positions Parsing
    best_position: integer(positions?.best_position) || 0,
    worst_position: integer(positions?.worst_position) || 0,
    average_position: decimal(positions?.average_position) || 0,
    victories: integer(positions?.victories) || 0,
    podiums: integer(positions?.podiums) || 0,

    // Transfers Parsing
    purchases: Number(transfers?.purchases) || 0,
    sales: Number(transfers?.sales) || 0,
    total_spent: Number(transfers?.total_spent) || 0,
    total_received: Number(transfers?.total_received) || 0,
    last_transfers: (transfers.last_transfers || []).map(mapManagerTransfer),

    position: Number(userStanding?.position) || 0,
    team_value: Number(userStanding?.team_value) || 0,
    price_trend: Number(userStanding?.price_trend) || 0,
  };
}

export function mapManagerSquadPlayer(
  p: ManagerSquadRecord,
  recentScores: string
): ManagerSquadPlayerViewModel {
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    team: p.team,
    team_img: p.team_img,
    team_short_name: p.team_short_name,
    price: p.price,
    price_increment: p.price_increment,
    points: p.points,
    average: p.average,
    img: p.img,
    recent_scores: recentScores,
  };
}
export function mapManagerSquad(
  players: ManagerSquadPlayerViewModel[],
  totalPoints: string | number,
  standing?: ManagerStanding
): ManagerSquadViewModel {
  return {
    total_value: players.reduce((sum, p) => sum + integer(p.price), 0),
    price_trend: players.reduce((sum, p) => sum + integer(p.price_increment), 0),
    total_points: totalPoints,
    player_count: players.length,
    position: Number(standing?.position) || 0,
    top_rising: players.filter((p) => integer(p.price_increment) > 0).slice(0, 7),
    top_falling: players
      .filter((p) => integer(p.price_increment) < 0)
      .slice(-7)
      .reverse(),
    players,
  };
}
export function mapManagerRounds(data: {
  rounds: {
    round_id: number | null;
    round_name: string | null;
    points: string | number;
    position: string | number;
    participated: number;
  }[];
  total_played: number;
  total_rounds: number;
}): ManagerRoundsViewModel {
  return {
    rounds: data.rounds.map((row) => ({
      round_id: row.round_id,
      round_name: row.round_name,
      points: integer(row.points),
      position: integer(row.position),
      participated: row.participated,
    })),
    total_played: data.total_played,
    total_rounds: data.total_rounds,
  };
}
