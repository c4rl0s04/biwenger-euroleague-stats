/** Preserve the existing UTF-16 length, whitespace and SQL wildcard behavior. */
export function parseSearchQuery(query: string | null | undefined): string | null {
  if (!query || query.trim().length < 2) return null;
  return query.trim();
}
