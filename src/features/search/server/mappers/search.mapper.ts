import type { GlobalSearchResult } from '../../models/search';
import type { SearchRecords } from '../queries/search.records';

/** Allowlists the exact existing search fields; no raw account/player rows escape. */
export function mapSearchResults(rows: SearchRecords): GlobalSearchResult {
  return {
    players: rows.players.map((row) => ({
      id: row.id,
      name: row.name,
      img: row.img,
      position: row.position,
      team: row.team,
      price: parseInt(String(row.price)),
      points: parseInt(String(row.points)),
    })),
    teams: rows.teams.map((row) => ({
      id: row.id,
      name: row.name,
      player_count: parseInt(String(row.player_count)),
    })),
    users: rows.users.map((row) => ({ id: row.id, name: row.name, icon: row.icon })),
  };
}
