import 'server-only';
import { fetchUserPlayers } from '../queries/owned-players.query';
import type { OwnedPlayer } from '../../models/owned-player';

export const OWNED_PLAYERS_POLICY = {
  access: 'caller-resolved fantasy owner',
  serverCache: 'none',
  mutations: 'none',
} as const;
export function createOwnedPlayersService(read = fetchUserPlayers) {
  return async function getOwnedPlayers(userId: number): Promise<OwnedPlayer[]> {
    return (await read(userId)).map((row) => ({
      id: row.id,
      name: row.name,
      teamId: row.team_id,
      teamName: row.team_name,
      teamCode: row.team_code,
      position: row.position,
      price: row.price,
      imageUrl: row.img,
      points: row.puntos,
    }));
  };
}
export const getOwnedPlayers = createOwnedPlayersService();
