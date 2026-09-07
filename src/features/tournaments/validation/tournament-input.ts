// Preserve the existing service coercion, including NaN (handled by PostgreSQL),
// whitespace, exponent/hex strings, and the different treatment of 0 vs '0'.
export const tournamentId = (id: string | number): number => Number(id);
export const fixtureTournamentId = (id: string | number | null): number | null =>
  id ? Number(id) : null;
