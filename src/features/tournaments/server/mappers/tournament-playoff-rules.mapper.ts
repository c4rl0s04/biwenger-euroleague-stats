import type { TournamentJson } from '../../models/tournaments';
import type { TournamentPlayoffRules } from '../../models/tournament-playoff-rules';

// All historical JSON roots remain accepted. Only the two consumed booleans escape.
function property(value: TournamentJson | undefined, key: string): TournamentJson | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value[key]
    : undefined;
}
export function mapTournamentPlayoffRules(snapshot: TournamentJson): TournamentPlayoffRules {
  const playoff = property(property(snapshot, 'config'), 'playoff');
  return {
    twoLegged: property(playoff, 'twoLegged') === true || property(playoff, 'twolegged') === true,
    twoLeggedFinal:
      property(playoff, 'twoLeggedFinal') === true || property(playoff, 'twoleggedfinal') === true,
  };
}
