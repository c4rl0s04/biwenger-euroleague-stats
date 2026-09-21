import 'server-only';
import { getRecentTransfers, getSignificantPriceChanges } from '@/features/market/server';
import { getUpcomingFeedMatches, getRecentFeedResults } from '@/features/matches/server';
import { mapTransfer, mapPriceChange, mapUpcomingMatch, mapResult } from '../mappers/news.mapper';
import type { NewsFeedItem } from '../../models/news';

export const NEWS_READ_POLICY = Object.freeze({
  access: 'public-historical-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
  httpMaxAge: 300,
  httpStaleWhileRevalidate: 60,
  failure: 'independent-source-partial-results',
} as const);
export interface NewsDependencies {
  transfers: typeof getRecentTransfers;
  prices: typeof getSignificantPriceChanges;
  upcoming: typeof getUpcomingFeedMatches;
  results: typeof getRecentFeedResults;
  now: () => number;
  random: () => number;
  reportError: (message: string, error: unknown) => void;
}
export function createNewsService(deps: NewsDependencies) {
  return async function fetchNewsFeed(): Promise<NewsFeedItem[]> {
    const news: NewsFeedItem[] = [];
    // Sequential, independent catches preserve source and partial-mapping behavior.
    try {
      (await deps.transfers(5)).forEach((t) => news.push(mapTransfer(t)));
    } catch (error) {
      deps.reportError('Error fetching transfers:', error);
    }
    try {
      (await deps.prices(24, 200000)).forEach((c) => news.push(mapPriceChange(c, deps.now)));
    } catch (error) {
      deps.reportError('Error fetching price changes:', error);
    }
    try {
      (await deps.upcoming(3)).forEach((m) => news.push(mapUpcomingMatch(m)));
    } catch (error) {
      deps.reportError('Error fetching upcoming matches:', error);
    }
    try {
      (await deps.results(3)).forEach((m) => news.push(mapResult(m)));
    } catch (error) {
      deps.reportError('Error fetching results:', error);
    }
    return news.sort(() => 0.5 - deps.random());
  };
}
export const fetchNewsFeed = createNewsService({
  transfers: getRecentTransfers,
  prices: getSignificantPriceChanges,
  upcoming: getUpcomingFeedMatches,
  results: getRecentFeedResults,
  now: () => Date.now(),
  random: () => Math.random(),
  reportError: (message, error) => console.error(message, error),
});
