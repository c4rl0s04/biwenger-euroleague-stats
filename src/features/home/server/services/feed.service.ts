import 'server-only';
import {
  queryHomeActivityRows,
  queryHomeRoundHighlightPlayers,
  type HomeRoundHighlightPlayerRow,
} from '../queries/home-feed.query';
import { decodeHomeFeedCursor, encodeHomeFeedCursor } from '../validation/cursor';
import {
  HOME_FEED_PAGE_SIZE,
  type HomeActivityFilter,
  type HomeActivityEvent,
  type HomeFeedPage,
} from '../../models/contracts';
import { normalizeActivityRow } from '../mappers/activity.mapper';
const asNumber = (value: unknown) => Number(value ?? 0);
interface GetHomeFeedPageInput {
  filter?: HomeActivityFilter;
  cursor?: string | null;
}

export function createHomeFeedService(deps: {
  rows: typeof queryHomeActivityRows;
  highlights: typeof queryHomeRoundHighlightPlayers;
}) {
  return async function getHomeFeedPage({
    filter = 'all',
    cursor: cursorValue = null,
  }: GetHomeFeedPageInput = {}): Promise<HomeFeedPage> {
    const cursor = cursorValue ? decodeHomeFeedCursor(cursorValue, filter) : null;
    const rows = await deps.rows({
      cursor,
      filter,
      limit: HOME_FEED_PAGE_SIZE + 1,
    });
    const pageRows = rows.slice(0, HOME_FEED_PAGE_SIZE);
    const hasMore = rows.length > HOME_FEED_PAGE_SIZE;
    const boundary = pageRows.at(-1);
    const highlightRoundIds = pageRows
      .filter((row) => row.type === 'round_highlight')
      .map((row) => asNumber(row.payload.roundId));
    const highlightPlayers = await deps.highlights(highlightRoundIds);
    const highlightsByRound = new Map<number, HomeRoundHighlightPlayerRow[]>();
    for (const player of highlightPlayers) {
      const roundPlayers = highlightsByRound.get(asNumber(player.round_id)) ?? [];
      roundPlayers.push(player);
      highlightsByRound.set(asNumber(player.round_id), roundPlayers);
    }
    const items = pageRows
      .map((row) =>
        normalizeActivityRow(
          row,
          row.type === 'round_highlight'
            ? (highlightsByRound.get(asNumber(row.payload.roundId)) ?? [])
            : []
        )
      )
      .filter((item): item is HomeActivityEvent => item !== null);

    return {
      items,
      hasMore,
      nextCursor:
        hasMore && boundary
          ? encodeHomeFeedCursor({
              occurredAt: new Date(boundary.occurred_at).toISOString(),
              id: boundary.id,
              filter,
            })
          : null,
    };
  };
}
export const getHomeFeedPage = createHomeFeedService({
  rows: queryHomeActivityRows,
  highlights: queryHomeRoundHighlightPlayers,
});
