import 'server-only';
import { db } from '@/lib/db/client';
import { teams, players, playerSeasons } from '@/lib/db/schema';
import { and, eq, sql } from 'drizzle-orm';
import { resolveReadSeasonId } from '@/lib/db/season-context';

// 5. Fetch User Players
export async function fetchUserPlayers(userId: number) {
  const seasonId = await resolveReadSeasonId();
  const rows = await db
    .select({
      id: players.id,
      name: players.name,
      team_id: playerSeasons.teamId,
      team_name: teams.shortName,
      team_code: sql<string>`COALESCE((SELECT provider_team_code FROM official_team_mappings WHERE season_id=${seasonId} AND team_id=${teams.id} AND provider='euroleague_advanced'), ${teams.code})`,
      position: playerSeasons.position,
      price: playerSeasons.price,
      img: sql<string>`COALESCE((SELECT image_url FROM official_player_mappings WHERE season_id=${seasonId} AND player_id=${players.id} AND provider='euroleague_advanced' AND status='matched'), ${players.img})`,
      puntos: playerSeasons.puntos,
    })
    .from(playerSeasons)
    .innerJoin(players, eq(playerSeasons.playerId, players.id))
    .leftJoin(teams, eq(playerSeasons.teamId, teams.id))
    .where(and(eq(playerSeasons.seasonId, seasonId), eq(playerSeasons.ownerId, userId.toString())));

  return rows;
}
