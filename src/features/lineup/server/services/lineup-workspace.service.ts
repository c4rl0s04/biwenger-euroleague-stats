import 'server-only';
import { executeUserProviderQuery } from '@/features/provider/server';
import { getPlayerRecentScores } from '@/features/players/server';
import { POSITIONS } from '../../logic/draft';
import type { LineupWorkspace, LineupWorkspacePlayer } from '../../models/workspace';
import { readWorkspacePlayers } from '../queries/workspace.query';
import { readLiveLineup } from './lineup-live.service';

export const LINEUP_WORKSPACE_POLICY = {
  access: 'authenticated actor only',
  cache: 'private no-store',
  providerRetries: 0,
} as const;
export async function getLineupWorkspace(userId: string): Promise<LineupWorkspace> {
  const live = await executeUserProviderQuery(userId, 'lineup.workspace', readLiveLineup);
  const [rows, form] = await Promise.all([
    readWorkspacePlayers(live.ownedIds),
    getPlayerRecentScores(5),
  ]);
  const players: LineupWorkspacePlayer[] = live.ownedIds.map((id) => {
    const row = rows.find((p) => String(p.id) === id);
    const name = row?.name || `Jugador ${id}`;
    const detailsAvailable = Boolean(
      row && POSITIONS.some((position) => position === row.position)
    );
    return {
      id,
      name: detailsAvailable ? name : `${name} (información pendiente)`,
      position: row?.position ?? null,
      team: row?.team ?? null,
      team_img: row?.team_img ?? null,
      team_short_name: row?.team_short_name ?? null,
      img: row?.img ?? null,
      price: row?.price == null ? null : Number(row.price),
      price_increment: row?.price_increment == null ? null : Number(row.price_increment),
      points: row?.points == null ? null : Number(row.points),
      average: row?.average == null ? null : Number(row.average),
      recent_scores: form.find((p) => String(p.playerId) === id)?.recentScores || '',
      detailsAvailable,
    };
  });
  return { provider: live.provider, players, baseline: live.baseline, checkedAt: live.checkedAt };
}
