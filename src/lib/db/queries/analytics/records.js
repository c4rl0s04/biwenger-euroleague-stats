import { db } from '../../client.js';

/**
 * Get recent records broken
 * @returns {Promise<Array>} Recent league records
 */
export async function getRecentRecords() {
  const records = [];

  const highestRoundQuery = `
    SELECT 
      ur.user_id,
      u.name as user_name,
      ur.round_name,
      ur.points
    FROM user_rounds ur
    JOIN users u ON ur.user_id = u.id
    WHERE ur.participated = TRUE
    ORDER BY ur.points DESC
    LIMIT 1
  `;
  const highestRound = (await db.query(highestRoundQuery)).rows[0];
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
    ORDER BY f.precio DESC
    LIMIT 1
  `;
  const highestTransfer = (await db.query(highestTransferQuery)).rows[0];
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
      id,
      name,
      price_increment,
      owner_id
    FROM players
    WHERE price_increment > 0
    ORDER BY price_increment DESC
    LIMIT 1
  `;
  const biggestGain = (await db.query(biggestGainQuery)).rows[0];
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
