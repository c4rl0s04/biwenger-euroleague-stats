type ProviderRecord = Record<string, unknown>;
type SafeIdentifier = string | number;

function isRecord(value: unknown): value is ProviderRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function safeIdentifier(value: unknown): SafeIdentifier | undefined {
  return typeof value === 'string' || typeof value === 'number' ? value : undefined;
}

function safeIdentifiers(value: unknown): SafeIdentifier[] {
  return Array.isArray(value)
    ? value.map(safeIdentifier).filter((item): item is SafeIdentifier => item !== undefined)
    : [];
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function mapLineup(value: unknown) {
  if (!isRecord(value)) return null;

  return {
    type: typeof value.type === 'string' ? value.type : undefined,
    playersID: safeIdentifiers(value.playersID),
    reservesID: safeIdentifiers(value.reservesID),
    captain: safeIdentifier(value.captain),
    striker: safeIdentifier(value.striker),
    coach: safeIdentifier(value.coach),
    date: safeIdentifier(value.date),
  };
}

function mapPlayers(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((player) => {
    const owner = isRecord(player.owner) ? player.owner : null;
    return {
      id: safeIdentifier(player.id),
      owner: owner ? { price: safeNumber(owner.price) } : null,
    };
  });
}

function mapMarket(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((listing) => {
    const player = isRecord(listing.player) ? listing.player : null;
    return {
      id: safeIdentifier(listing.id),
      playerID: safeIdentifier(listing.playerID),
      player: player ? { id: safeIdentifier(player.id) } : null,
      price: safeNumber(listing.price),
    };
  });
}

function mapOffers(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value.filter(isRecord).map((offer) => ({
    id: safeIdentifier(offer.id),
    amount: safeNumber(offer.amount),
    until: safeNumber(offer.until),
    requestedPlayers: safeIdentifiers(offer.requestedPlayers),
  }));
}

export function createSafeLineupResponse(value: unknown) {
  const providerData = isRecord(value) ? value : {};

  return {
    lineup: mapLineup(providerData.lineup),
    players: mapPlayers(providerData.players),
    market: mapMarket(providerData.market),
    offers: mapOffers(providerData.offers),
  };
}
