import 'server-only';
import { resolvePlayerCatalogueSeason as resolveReadSeasonId } from '../queries/player.query';
import { getPlayerFormMap } from '@/features/player-form/server';
import {
  readTopPlayerRows,
  readTopFormPlayerRows,
  readAllPlayerRows,
  type CorePlayer,
  type PlayerRecentForm,
} from '../queries/player.query';

// Preserve read order, independent season resolution and existing metadata/form joins.
export async function getTopPlayers(limit: number = 6): Promise<CorePlayer[]> {
  const seasonId = await resolveReadSeasonId();

  const [rows, formMap] = await Promise.all([
    readTopPlayerRows(limit, seasonId),
    getPlayerFormMap(),
  ]);

  return rows.map((row) => ({
    ...row,
    average: parseFloat(String(row.average)) || 0,
    recent_scores: formMap.get(Number(row.id))?.recent_scores ?? null,
  }));
}

export async function getTopPlayersByForm(
  limit: number = 5,
  rounds: number = 3
): Promise<PlayerRecentForm[]> {
  const seasonId = await resolveReadSeasonId();
  // 1. Get the form map for everyone with the specified round window
  const formMap = await getPlayerFormMap(rounds);

  // 2. Identify the top players by form from the map
  const topFormEntries = Array.from(formMap.values())
    .sort((a, b) => b.avg_form_score - a.avg_form_score)
    .slice(0, limit * 2); // Fetch extra for safety

  if (topFormEntries.length === 0) return [];

  const playerIds = topFormEntries.map((e) => e.player_id);

  // 3. Fetch metadata for these specific players

  const rows = await readTopFormPlayerRows(playerIds, seasonId);

  // 4. Merge metadata with form data and sort final list
  return rows
    .map((row) => {
      const form = formMap.get(Number(row.id));
      return {
        ...row,
        id: Number(row.id),
        total_points: parseInt(String(row.total_points)) || 0,
        games_played: parseInt(String(row.games_played)) || 0,
        avg_points: form?.avg_form_score || 0,
        recent_scores: form?.recent_scores || '',
      };
    })
    .sort((a, b) => b.avg_points - a.avg_points)
    .slice(0, limit);
}

export async function getAllPlayers(): Promise<CorePlayer[]> {
  const seasonId = await resolveReadSeasonId();

  const [rows, formMap] = await Promise.all([readAllPlayerRows(seasonId), getPlayerFormMap()]);

  return rows.map((player) => ({
    ...player,
    total_points: parseFloat(String(player.total_points)) || 0,
    played: parseInt(String(player.played)) || 0,
    average: parseFloat(String(player.average)) || 0,
    best_score: parseFloat(String(player.best_score)) || 0,
    worst_score: parseFloat(String(player.worst_score)) || 0,
    price: parseInt(String(player.price)) || 0,
    recent_scores: formMap.get(Number(player.id))?.recent_scores ?? null,
    avg_form_score: formMap.get(Number(player.id))?.avg_form_score ?? 0,
  }));
}
