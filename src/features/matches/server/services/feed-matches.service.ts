import 'server-only';
import type { FeedMatch, FeedResult } from '../../models/feed-match';
import { readUpcomingFeedMatches, readRecentFeedResults } from '../queries/feed-matches.query';
import { mapFeedMatch, mapFeedResult } from '../mappers/feed-matches.mapper';

export const FEED_MATCHES_POLICY = Object.freeze({
  access: 'public-season-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);
export async function getUpcomingFeedMatches(limit = 5): Promise<FeedMatch[]> {
  return (await readUpcomingFeedMatches(limit)).map(mapFeedMatch);
}
export async function getRecentFeedResults(limit = 5): Promise<FeedResult[]> {
  return (await readRecentFeedResults(limit)).map(mapFeedResult);
}
