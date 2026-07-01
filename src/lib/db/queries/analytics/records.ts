import { db, pgClient } from '../../index';
import { resolveReadSeasonId } from '../../season-context';

export interface RecordItem {
  type: 'highest_round' | 'highest_transfer' | 'biggest_gain';
  label: string;
  description: string;
  user_name?: string;
  player_name?: string;
  value: number | string;
}

/**
 * Get recent records broken
 * @returns {Promise<RecordItem[]>} Recent league records
 */
export async function getRecentRecords(): Promise<RecordItem[]> {
  const seasonId = await resolveReadSeasonId();
  const records: RecordItem[] = [];

  const highestRoundQuery = `
    SELECT 
      ur.user_id,
      COALESCE(us.name, u.name) as user_name,
      ur.round_name,
      ur.points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    JOIN user_seasons us ON us.user_id = u.id AND us.season_id = ur.season_id
    WHERE ur.season_id = $1 AND ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  const highestRound = (await pgClient.query(highestRoundQuery, [seasonId])).rows[0];
  if (highestRound) {
    records.push({
      type: 'highest_round',
      label: 'Récord de puntos en jornada',
      description: `${highestRound.user_name} - ${highestRound.points} pts en ${highestRound.round_name}`,
      user_name: highestRound.user_name,
      value: highestRound.points,
    });
  }

  const highestTransferQuery = `
    SELECT 
      f.precio,
      p.name as player_name,
      f.comprador,
      f.fecha
    FROM fichajes f
    JOIN players p ON f.player_id = p.id
    WHERE f.season_id = $1
    ORDER BY f.precio DESC
    LIMIT 1
  `;
  const highestTransfer = (await pgClient.query(highestTransferQuery, [seasonId])).rows[0];
  if (highestTransfer) {
    records.push({
      type: 'highest_transfer',
      label: 'Fichaje más caro',
      description: `${highestTransfer.player_name} - ${(parseInt(highestTransfer.precio) / 1000000).toFixed(2)}M€ (${highestTransfer.comprador})`,
      user_name: highestTransfer.comprador,
      value: highestTransfer.precio,
    });
  }

  const biggestGainQuery = `
    SELECT 
      p.id,
      p.name,
      ps.price_increment,
      ps.owner_id
    FROM players p
    JOIN player_seasons ps ON ps.player_id = p.id
    WHERE ps.season_id = $1 AND ps.price_increment > 0
    ORDER BY ps.price_increment DESC
    LIMIT 1
  `;
  const biggestGain = (await pgClient.query(biggestGainQuery, [seasonId])).rows[0];
  if (biggestGain && biggestGain.price_increment > 0) {
    records.push({
      type: 'biggest_gain',
      label: 'Mayor revalorización',
      description: `${biggestGain.name} +${(parseInt(biggestGain.price_increment) / 1000000).toFixed(2)}M€`,
      player_name: biggestGain.name,
      value: biggestGain.price_increment,
    });
  }

  return records.slice(0, 3);
}
