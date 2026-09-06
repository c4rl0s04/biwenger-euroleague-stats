// Compatibility for the legacy database barrel until its consumers migrate.
export { performGlobalSearch as globalSearch } from '@/features/search/server';
export type {
  GlobalSearchResult,
  SearchPlayer,
  SearchTeam,
  SearchUser,
} from '@/features/search/public';
