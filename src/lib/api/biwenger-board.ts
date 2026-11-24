import type { biwengerFetch } from './biwenger-client';
import { CONFIG } from '../config';

export interface BiwengerBoardPage {
  data?: Array<{ type: string; date: number; content?: unknown }>;
}

export async function readBiwengerBoardPage(
  fetch: typeof biwengerFetch,
  leagueId: string,
  offset: number,
  limit: number,
  options?: Parameters<typeof biwengerFetch>[1]
): Promise<BiwengerBoardPage> {
  return fetch(CONFIG.ENDPOINTS.BIWENGER.LEAGUE_BOARD(leagueId, offset, limit), options);
}
