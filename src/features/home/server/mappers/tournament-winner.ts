export interface ParsedTournamentWinner {
  id: string | null;
  name: string | null;
  icon: string | null;
}

export function parseTournamentWinner(value: unknown): ParsedTournamentWinner | null {
  try {
    const data = typeof value === 'string' ? JSON.parse(value) : value;
    if (!data || typeof data !== 'object') return null;
    const winner = (data as Record<string, unknown>).winner;
    if (!winner || typeof winner !== 'object') return null;
    const record = winner as Record<string, unknown>;
    const id =
      typeof record.id === 'string' || typeof record.id === 'number' ? String(record.id) : null;
    const name = typeof record.name === 'string' && record.name.length > 0 ? record.name : null;
    const icon = typeof record.icon === 'string' && record.icon.length > 0 ? record.icon : null;
    return id || name ? { id, name, icon } : null;
  } catch {
    return null;
  }
}
