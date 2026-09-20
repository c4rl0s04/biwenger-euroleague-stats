import type { ScheduleFixture, ScheduleRoundOption } from '@/features/matches/public';
import type { OwnedPlayer } from '@/features/managers/public';
import { getTeamColor } from '@/lib/constants/teamColors';
import type { ScheduleRound, SchedulePlayer, ScheduleMatch } from '../../models/schedule';

export function mapScheduleRound(round: ScheduleRoundOption): ScheduleRound {
  return {
    round_id: round.roundId,
    round_name: round.roundName,
    ...('firstMatchDate' in round ? { min_date: round.firstMatchDate } : {}),
  };
}
export function mapSchedulePlayer(player: OwnedPlayer): SchedulePlayer {
  return {
    id: player.id,
    name: player.name,
    team_id: player.teamId,
    team_name: player.teamName,
    team_code: player.teamCode,
    position: player.position,
    price: player.price,
    img: player.imageUrl,
    puntos: player.points,
  };
}
export function mapScheduleMatches(
  fixtures: ScheduleFixture[],
  players: SchedulePlayer[]
): ScheduleMatch[] {
  return fixtures.map((match) => {
    const userPlayers = players
      .filter((p) => p.team_id === match.homeId || p.team_id === match.awayId)
      .map((p) => ({
        ...p,
        is_home: p.team_id === match.homeId,
        opponent: p.team_id === match.homeId ? match.awayName : match.homeName,
        team_color: getTeamColor(p.team_code),
      }))
      .sort((a, b) => (b.puntos || 0) - (a.puntos || 0));
    return {
      match_id: match.id,
      date: match.date,
      home_id: match.homeId,
      away_id: match.awayId,
      home_team: match.homeName,
      away_team: match.awayName,
      home_code: match.homeCode,
      away_code: match.awayCode,
      home_team_color: getTeamColor(match.homeCode),
      away_team_color: getTeamColor(match.awayCode),
      user_players: userPlayers,
      has_players: userPlayers.length > 0,
      listItem: {
        id: match.id,
        date: match.date,
        status: null,
        home: { id: Number(match.homeId), name: String(match.homeName ?? 'Local'), score: null },
        away: {
          id: Number(match.awayId),
          name: String(match.awayName ?? 'Visitante'),
          score: null,
        },
      },
    };
  });
}
