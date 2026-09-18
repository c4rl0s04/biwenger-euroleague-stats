import type {
  TeamMatchCounts,
  TeamQualificationProbabilities,
} from '../../models/team-competition';
import type {
  TeamCompetitionFacts,
  TeamMatchCountRecord,
} from '../queries/team-competition.records';

export function mapTeamMatchCounts(rows: TeamMatchCountRecord[]): TeamMatchCounts {
  const result: TeamMatchCounts = {};
  for (const row of rows) result[Number(row.team_id)] = parseInt(String(row.count), 10);
  return result;
}

export function mapTeamQualificationProbabilities(
  facts: TeamCompetitionFacts
): TeamQualificationProbabilities {
  const standings = facts.standings;
  const tenthPlace = standings.find((s) => Number(s.position) === 10);
  const tenthWins = tenthPlace ? Number(tenthPlace.wins) : 0;

  const formData = new Map(facts.form.map((r) => [Number(r.team_id), Number(r.recent_wins)]));
  const nextOpponentsMap = new Map<number, number[]>();
  for (const row of facts.opponents) {
    const tid = Number(row.team_id);
    const oppId = Number(row.opponent_id);
    if (!nextOpponentsMap.has(tid)) nextOpponentsMap.set(tid, []);
    nextOpponentsMap.get(tid)!.push(oppId);
  }

  const result: Record<number, number> = {};

  for (const teamStanding of standings) {
    const numericTeamId = Number(teamStanding.team_id);
    let probability = 50; // Base 50%
    const teamPosition = Number(teamStanding.position);
    const teamWins = Number(teamStanding.wins);

    // Rule 1: Standings logic
    if (teamPosition <= 4) probability = 95;
    else if (teamPosition <= 6) probability = 80;
    else if (teamPosition <= 10) probability = 60;
    else {
      const winDiff = tenthWins - teamWins;
      probability = 50 - winDiff * 15;
    }

    // Rule 2: Form logic
    const recentWins = formData.get(numericTeamId) || 0;
    if (recentWins === 5) probability += 15;
    else if (recentWins === 4) probability += 8;
    else if (recentWins === 3) probability += 2;
    else if (recentWins === 2) probability -= 2;
    else if (recentWins === 1) probability -= 8;
    else if (recentWins === 0) probability -= 15;

    // Rule 3: Schedule Difficulty logic
    const oppIds = nextOpponentsMap.get(numericTeamId) || [];
    if (oppIds.length > 0) {
      const oppPositions = standings
        .filter((s) => oppIds.includes(Number(s.team_id)))
        .map((s) => Number(s.position));

      if (oppPositions.length > 0) {
        const avgOppPosition =
          oppPositions.reduce((sum, pos) => sum + pos, 0) / oppPositions.length;
        if (avgOppPosition <= 6)
          probability -= 12; // Hard schedule
        else if (avgOppPosition >= 13) probability += 12; // Easy schedule
      }
    }

    // Boundary check
    if (probability > 99) probability = 99;
    if (probability < 1) probability = 1;

    result[numericTeamId] = Math.round(probability);
  }

  return result;
}
