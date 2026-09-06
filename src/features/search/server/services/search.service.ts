import 'server-only';

import { emptySearchResult, type GlobalSearchResult } from '../../models/search';
import { parseSearchQuery } from '../../validation/search-input';
import { mapSearchResults } from '../mappers/search.mapper';
import { findSearchRecords } from '../queries/search.query';
import type { SearchRecords } from '../queries/search.records';

export const SEARCH_HTTP_CACHE_SECONDS = 60;
export const SEARCH_ACCESS_POLICY = Object.freeze({
  read: 'public fantasy directory',
  identity: 'none',
  serverCache: 'none',
} as const);

export interface SearchServiceDependencies {
  findRecords(query: string, limit: number): Promise<SearchRecords>;
}

export function createSearchService(dependencies: SearchServiceDependencies) {
  return async function performGlobalSearch(
    query: string | null | undefined,
    limit: number = 5
  ): Promise<GlobalSearchResult> {
    const term = parseSearchQuery(query);
    if (term === null) return emptySearchResult();
    // No memoization: preserve fresh server reads and the caller's existing HTTP cache.
    return mapSearchResults(await dependencies.findRecords(term, limit));
  };
}

export const performGlobalSearch = createSearchService({ findRecords: findSearchRecords });
