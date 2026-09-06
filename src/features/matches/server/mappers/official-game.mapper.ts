import type { OfficialPlaysViewModel, OfficialShotsViewModel } from '../../models/official-game';
import type {
  OfficialGameRow,
  OfficialPlayRow,
  OfficialShotRow,
} from '../queries/official-game.records';

// Match JSON.stringify(Date) without coercing existing strings or nullable values.
function dateToJson(value: Date | string | null): string | null {
  return value instanceof Date ? value.toJSON() : value;
}

function mapGame<T>(row: OfficialGameRow<T>) {
  return {
    match: { id: row.match.id, status: row.match.status },
    scheduledAt: dateToJson(row.scheduledAt),
    finalizedAt: dateToJson(row.finalizedAt),
  };
}

export function mapOfficialPlays(row: OfficialGameRow<OfficialPlayRow>): OfficialPlaysViewModel {
  return {
    ...mapGame(row),
    items: row.items.map((item) => ({
      sequence: item.sequence,
      provider_play_number: item.provider_play_number,
      period: item.period,
      minute: item.minute,
      marker_time: item.marker_time,
      play_type: item.play_type,
      team_code: item.team_code,
      provider_player_code: item.provider_player_code,
      player_id: item.player_id,
      player_name: item.player_name,
      team_name: item.team_name,
      dorsal: item.dorsal,
      home_score: item.home_score,
      away_score: item.away_score,
      comment: item.comment,
      play_info: item.play_info,
    })),
  };
}

export function mapOfficialShots(row: OfficialGameRow<OfficialShotRow>): OfficialShotsViewModel {
  return {
    ...mapGame(row),
    items: row.items.map((item) => ({
      annotation_number: item.annotation_number,
      team_code: item.team_code,
      provider_player_code: item.provider_player_code,
      player_id: item.player_id,
      player_name: item.player_name,
      action_id: item.action_id,
      action: item.action,
      points: item.points,
      coordinate_x: item.coordinate_x,
      coordinate_y: item.coordinate_y,
      zone: item.zone,
      is_fastbreak: item.is_fastbreak,
      is_second_chance: item.is_second_chance,
      is_points_off_turnover: item.is_points_off_turnover,
      minute: item.minute,
      marker_time: item.marker_time,
      home_score: item.home_score,
      away_score: item.away_score,
      occurred_at: dateToJson(item.occurred_at),
    })),
  };
}
