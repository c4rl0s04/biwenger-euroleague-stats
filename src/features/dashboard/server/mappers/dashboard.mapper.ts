import type { CalendarRound, LastRoundStats, HighestRoundRecord } from '@/features/rounds/public';
import type { HighestTransferRecord, BiggestGainRecord } from '@/features/market/public';
import type {
  DashboardCalendarRound,
  DashboardIdealLineup,
  DashboardRecord,
} from '../../models/dashboard';

export function mapDashboardCalendarRound(
  round: CalendarRound | null
): DashboardCalendarRound | null {
  return round
    ? {
        round_id: round.roundId,
        round_name: round.roundName,
        start_date: round.startDate,
        end_date: round.endDate,
        total_matches: round.totalMatches,
        finished_matches: round.finishedMatches,
        status_calc: round.status,
        matches: round.matches.map((match) => ({
          id: match.id,
          date: match.date,
          status: match.status,
          round_id: match.roundId,
          round_name: match.roundName,
        })),
      }
    : null;
}
export function mapDashboardIdealLineup(players: LastRoundStats[]): DashboardIdealLineup {
  if (!players?.length) return { lineup: [], total_points: 0, round_name: '-' };
  const lineup: DashboardIdealLineup['lineup'] = [];
  const positionCounts: Record<string, number> = {};
  let totalPoints = 0;
  for (const player of players) {
    if (lineup.length >= 5) break;
    const position = String(player.position);
    const count = positionCounts[position] || 0;
    if (count < 3) {
      lineup.push({
        ...player,
        img: `https://cdn.biwenger.com/players/euroleague/${player.player_id}.png`,
      });
      positionCounts[position] = count + 1;
      totalPoints += player.points ?? 0;
    }
  }
  return { lineup, total_points: totalPoints, round_name: players[0].round_name };
}
export function mapDashboardRecords(
  round: HighestRoundRecord | null,
  transfer: HighestTransferRecord | null,
  gain: BiggestGainRecord | null
): DashboardRecord[] {
  const records: DashboardRecord[] = [];
  if (round)
    records.push({
      type: 'highest_round',
      label: 'Récord de puntos en jornada',
      description: `${round.user_name} - ${round.points} pts en ${round.round_name}`,
      user_name: round.user_name,
      value: round.points,
    });
  if (transfer)
    records.push({
      type: 'highest_transfer',
      label: 'Fichaje más caro',
      description: `${transfer.player_name} - ${(parseInt(String(transfer.precio)) / 1000000).toFixed(2)}M€ (${transfer.comprador})`,
      user_name: transfer.comprador,
      value: transfer.precio,
    });
  if (gain && Number(gain.price_increment) > 0)
    records.push({
      type: 'biggest_gain',
      label: 'Mayor revalorización',
      description: `${gain.name} +${(parseInt(String(gain.price_increment)) / 1000000).toFixed(2)}M€`,
      player_name: gain.name,
      value: gain.price_increment,
    });
  return records.slice(0, 3);
}
