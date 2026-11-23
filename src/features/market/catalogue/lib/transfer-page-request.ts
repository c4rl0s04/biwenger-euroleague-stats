export function buildTransferPageRequest(
  seasonId: string | null | undefined,
  page: number,
  { buyer, seller }: { buyer: string; seller: string }
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: '8',
    ...(buyer && { buyer }),
    ...(seller && { seller }),
  });
  const endpoint = `/api/market/transfers?${query.toString()}`;

  return {
    endpoint,
    cacheKey: seasonId ? `market-transfers:${seasonId}:${query.toString()}` : null,
  };
}
