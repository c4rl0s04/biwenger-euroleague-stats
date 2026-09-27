/**
 * Team Standings Calculator
 *
 * Calculates team standings from match results with EuroLeague official tie-breaking rules.
 * Implements Articles 19.1-19.6 of EuroLeague regulations.
 *
 * Article 19.4: Overtime points are excluded - uses home_score_regtime and away_score_regtime
 * Note: Article 19.1 (sanctioned teams) is not implemented as we don't track sanctions.
 * Note: Article 19.6 (20-0 forfeit handling) is not implemented as we don't track forfeits.
 */

import { getStandingsScores, MatchScoreSource } from './match-scores';

export interface StandingsMatch extends MatchScoreSource {
  home_id: number;
  away_id: number;
  status: string;
}

export interface TeamStats {
  team_id: number;
  wins: number;
  draws: number;
  losses: number;
  gamesPlayed: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
  position?: number;
}

interface H2HStats {
  wins: number;
  pointDifference: number;
  pointsFor: number;
  pointsAgainst: number;
}

/**
 * Calculate goal average (points for / points against) for a team
 * @param pointsFor - Total points scored
 * @param pointsAgainst - Total points conceded
 * @returns Goal average (precision: 0.00001)
 */
function calculateGoalAverage(pointsFor: number, pointsAgainst: number): number {
  if (pointsAgainst === 0) return pointsFor > 0 ? Infinity : 0;
  return Math.round((pointsFor / pointsAgainst) * 100000) / 100000;
}

/**
 * Count how many times teams have played each other
 * @param matches - All finished matches
 * @param teamIds - Set of team IDs to check
 * @returns Map of "team1-team2" to count of games
 */
function countHeadToHeadGames(
  matches: StandingsMatch[],
  teamIds: Set<number>
): Map<string, number> {
  const gameCounts = new Map<string, number>();

  for (const match of matches) {
    const { home_id, away_id } = match;

    if (teamIds.has(home_id) && teamIds.has(away_id)) {
      const key1 = `${home_id}-${away_id}`;
      const key2 = `${away_id}-${home_id}`;
      gameCounts.set(key1, (gameCounts.get(key1) || 0) + 1);
      gameCounts.set(key2, (gameCounts.get(key2) || 0) + 1);
    }
  }

  return gameCounts;
}

/**
 * Check if all tied teams have met twice (home and away)
 * @param matches - All finished matches
 * @param tiedTeamIds - Set of tied team IDs
 * @returns True if all teams have met twice
 */
function haveAllTeamsMetTwice(matches: StandingsMatch[], tiedTeamIds: Set<number>): boolean {
  const teamIdsArray = Array.from(tiedTeamIds);

  // For each pair of teams, check if they've played twice
  for (let i = 0; i < teamIdsArray.length; i++) {
    for (let j = i + 1; j < teamIdsArray.length; j++) {
      const team1 = teamIdsArray[i];
      const team2 = teamIdsArray[j];

      let gameCount = 0;
      for (const match of matches) {
        if (
          (match.home_id === team1 && match.away_id === team2) ||
          (match.home_id === team2 && match.away_id === team1)
        ) {
          gameCount++;
        }
      }

      if (gameCount < 2) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Calculate head-to-head stats between tied teams
 * @param matches - All finished matches
 * @param tiedTeamIds - Set of team IDs that are tied
 * @returns Map of team_id to h2h stats
 */
function calculateHeadToHead(
  matches: StandingsMatch[],
  tiedTeamIds: Set<number>
): Map<number, H2HStats> {
  const h2hStats = new Map<number, H2HStats>();

  // Initialize stats for all tied teams
  for (const teamId of Array.from(tiedTeamIds)) {
    h2hStats.set(teamId, { wins: 0, pointDifference: 0, pointsFor: 0, pointsAgainst: 0 });
  }

  // Process matches between tied teams only
  for (const match of matches) {
    const { home_id, away_id } = match;

    // Use regular time scores (excluding overtime) per Article 19.4
    const { homeScore, awayScore } = getStandingsScores(match);

    // Only consider matches between tied teams
    if (tiedTeamIds.has(home_id) && tiedTeamIds.has(away_id)) {
      // Use ! because we initialized it above
      const homeStats = h2hStats.get(home_id)!;
      const awayStats = h2hStats.get(away_id)!;

      // Update points
      homeStats.pointsFor += homeScore;
      homeStats.pointsAgainst += awayScore;
      awayStats.pointsFor += awayScore;
      awayStats.pointsAgainst += homeScore;

      // Update point differences
      homeStats.pointDifference += homeScore - awayScore;
      awayStats.pointDifference += awayScore - homeScore;

      // Update wins
      if (homeScore > awayScore) {
        homeStats.wins++;
      } else if (awayScore > homeScore) {
        awayStats.wins++;
      }
    }
  }

  return h2hStats;
}

/**
 * Break tie for two teams (Article 19.5.2.I)
 * @param matches - All finished matches
 * @param team1Id - First team ID
 * @param team2Id - Second team ID
 * @param team1Stats - First team overall stats
 * @param team2Stats - Second team overall stats
 * @returns Comparison result (-1, 0, or 1)
 */
function breakTieTwoTeams(
  matches: StandingsMatch[],
  team1Id: number,
  team2Id: number,
  team1Stats: TeamStats,
  team2Stats: TeamStats
): number {
  const tiedTeamIds = new Set([team1Id, team2Id]);
  const h2hStats = calculateHeadToHead(matches, tiedTeamIds);

  const team1H2H = h2hStats.get(team1Id) || {
    wins: 0,
    pointDifference: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };
  const team2H2H = h2hStats.get(team2Id) || {
    wins: 0,
    pointDifference: 0,
    pointsFor: 0,
    pointsAgainst: 0,
  };

  // a) Victories in games between them
  if (team2H2H.wins !== team1H2H.wins) {
    return team2H2H.wins - team1H2H.wins;
  }

  // Goal difference in games between them
  if (team2H2H.pointDifference !== team1H2H.pointDifference) {
    return team2H2H.pointDifference - team1H2H.pointDifference;
  }

  // Overall goal difference
  if (team2Stats.pointDifference !== team1Stats.pointDifference) {
    return team2Stats.pointDifference - team1Stats.pointDifference;
  }

  // Greatest number of points scored
  if (team2Stats.pointsFor !== team1Stats.pointsFor) {
    return team2Stats.pointsFor - team1Stats.pointsFor;
  }

  // Goal average
  const team1Avg = calculateGoalAverage(team1Stats.pointsFor, team1Stats.pointsAgainst);
  const team2Avg = calculateGoalAverage(team2Stats.pointsFor, team2Stats.pointsAgainst);
  return team2Avg - team1Avg;
}

/**
 * Break tie for multiple teams (Article 19.5.2.II)
 * @param matches - All finished matches
 * @param tiedTeams - Array of team objects with same wins
 * @param allTeamStats - Map of all team stats
 * @returns Sorted array of tied teams
 */
function breakTieMultipleTeams(
  matches: StandingsMatch[],
  tiedTeams: TeamStats[],
  allTeamStats: Map<number, TeamStats>
): TeamStats[] {
  if (tiedTeams.length === 0) return [];
  if (tiedTeams.length === 1) return tiedTeams;
  if (tiedTeams.length === 2) {
    // Use two-team procedure
    const [team1, team2] = tiedTeams;
    const result = breakTieTwoTeams(
      matches,
      team1.team_id,
      team2.team_id,
      allTeamStats.get(team1.team_id)!,
      allTeamStats.get(team2.team_id)!
    );
    return result > 0 ? [team2, team1] : [team1, team2];
  }

  // More than two teams
  const tiedTeamIds = new Set(tiedTeams.map((t) => t.team_id));
  const h2hStats = calculateHeadToHead(matches, tiedTeamIds);

  // a) Victories among tied teams only
  const sortedByH2HWins = [...tiedTeams].sort((a, b) => {
    const aH2H = h2hStats.get(a.team_id) || { wins: 0 };
    const bH2H = h2hStats.get(b.team_id) || { wins: 0 };
    return bH2H.wins - aH2H.wins;
  });

  // Group by h2h wins
  const groupsByH2HWins = new Map<number, TeamStats[]>();
  for (const team of sortedByH2HWins) {
    const h2h = h2hStats.get(team.team_id) || { wins: 0 };
    const key = h2h.wins;
    if (!groupsByH2HWins.has(key)) {
      groupsByH2HWins.set(key, []);
    }
    groupsByH2HWins.get(key)!.push(team);
  }

  const result: TeamStats[] = [];

  // Process each group
  for (const [_, group] of Array.from(groupsByH2HWins.entries()).sort((a, b) => b[0] - a[0])) {
    if (group.length === 1) {
      result.push(group[0]);
    } else if (group.length === 2) {
      // Use two-team procedure
      const [team1, team2] = group;
      const tieResult = breakTieTwoTeams(
        matches,
        team1.team_id,
        team2.team_id,
        allTeamStats.get(team1.team_id)!,
        allTeamStats.get(team2.team_id)!
      );
      if (tieResult > 0) {
        result.push(team2, team1);
      } else {
        result.push(team1, team2);
      }
    } else {
      // Still more than 2 teams tied
      const groupIds = new Set(group.map((t) => t.team_id));
      const groupH2H = calculateHeadToHead(matches, groupIds);

      // b) Goal difference among tied teams only
      const sortedByH2HDiff = [...group].sort((a, b) => {
        const aH2H = groupH2H.get(a.team_id) || { pointDifference: 0 };
        const bH2H = groupH2H.get(b.team_id) || { pointDifference: 0 };
        return bH2H.pointDifference - aH2H.pointDifference;
      });

      // Group by h2h point difference
      const groupsByH2HDiff = new Map<number, TeamStats[]>();
      for (const team of sortedByH2HDiff) {
        const h2h = groupH2H.get(team.team_id) || { pointDifference: 0 };
        const key = h2h.pointDifference;
        if (!groupsByH2HDiff.has(key)) {
          groupsByH2HDiff.set(key, []);
        }
        groupsByH2HDiff.get(key)!.push(team);
      }

      // Process each group by h2h diff
      for (const [_, diffGroup] of Array.from(groupsByH2HDiff.entries()).sort(
        (a, b) => b[0] - a[0]
      )) {
        if (diffGroup.length === 1) {
          result.push(diffGroup[0]);
        } else {
          // c) Overall goal difference, then points scored, then goal average
          const sortedByOverall = [...diffGroup].sort((a, b) => {
            const aStats = allTeamStats.get(a.team_id)!;
            const bStats = allTeamStats.get(b.team_id)!;

            // Overall goal difference
            if (bStats.pointDifference !== aStats.pointDifference) {
              return bStats.pointDifference - aStats.pointDifference;
            }

            // Points scored
            if (bStats.pointsFor !== aStats.pointsFor) {
              return bStats.pointsFor - aStats.pointsFor;
            }

            // Goal average
            const aAvg = calculateGoalAverage(aStats.pointsFor, aStats.pointsAgainst);
            const bAvg = calculateGoalAverage(bStats.pointsFor, bStats.pointsAgainst);
            return bAvg - aAvg;
          });

          result.push(...sortedByOverall);
        }
      }
    }
  }

  return result;
}

/**
 * Calculate team standings from match results
 * @param matches - Array of match objects
 * @returns Map of team_id to standings data
 */
export function calculateTeamStandings(matches: StandingsMatch[]): Map<number, TeamStats> {
  // Filter only finished matches
  const finishedMatches = matches.filter(
    (m) => m.status === 'finished' && m.home_score != null && m.away_score != null
  );

  // Initialize team stats
  const teamStats = new Map<number, TeamStats>();

  // Process each match
  for (const match of finishedMatches) {
    const { home_id, away_id } = match;

    // Use regular time scores (excluding overtime) for Points Calculation per Article 19.4
    const { homeScore, awayScore } = getStandingsScores(match);

    // Use FINAL scores for Win/Loss determination (OT counts for W/L)
    const homeFinal = match.home_score ?? homeScore;
    const awayFinal = match.away_score ?? awayScore;

    // Initialize home team stats if needed
    if (!teamStats.has(home_id)) {
      teamStats.set(home_id, {
        team_id: home_id,
        wins: 0,
        draws: 0,
        losses: 0,
        gamesPlayed: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifference: 0,
      });
    }

    // Initialize away team stats if needed
    if (!teamStats.has(away_id)) {
      teamStats.set(away_id, {
        team_id: away_id,
        wins: 0,
        draws: 0,
        losses: 0,
        gamesPlayed: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        pointDifference: 0,
      });
    }

    const homeStats = teamStats.get(home_id)!;
    const awayStats = teamStats.get(away_id)!;

    // Update points scored/conceded (Regular Time)
    homeStats.pointsFor += homeScore;
    homeStats.pointsAgainst += awayScore;
    awayStats.pointsFor += awayScore;
    awayStats.pointsAgainst += homeScore;

    // Update games played
    homeStats.gamesPlayed++;
    awayStats.gamesPlayed++;

    // Determine result (Final Score)
    if (homeFinal > awayFinal) {
      homeStats.wins++;
      awayStats.losses++;
    } else if (awayFinal > homeFinal) {
      awayStats.wins++;
      homeStats.losses++;
    } else {
      homeStats.draws++;
      awayStats.draws++;
    }
  }

  // Calculate point differences (Regular Time)
  for (const stats of Array.from(teamStats.values())) {
    stats.pointDifference = stats.pointsFor - stats.pointsAgainst;
  }

  // Convert to array and sort by EuroLeague rules
  const standingsArray = Array.from(teamStats.values());

  // Step 1: Sort by wins (primary)
  standingsArray.sort((a, b) => b.wins - a.wins);

  // Step 2: Apply tie-breaking for teams with same wins
  const finalStandings: TeamStats[] = [];
  let i = 0;

  while (i < standingsArray.length) {
    // Find all teams with the same number of wins
    const currentWins = standingsArray[i].wins;
    const tiedGroup: TeamStats[] = [];

    while (i < standingsArray.length && standingsArray[i].wins === currentWins) {
      tiedGroup.push(standingsArray[i]);
      i++;
    }

    if (tiedGroup.length === 1) {
      // No tie, just add the team
      finalStandings.push(tiedGroup[0]);
    } else {
      // Article 19.2: Teams with fewer games rank first
      const teamsByGames = new Map<number, TeamStats[]>();
      for (const team of tiedGroup) {
        const key = team.gamesPlayed;
        if (!teamsByGames.has(key)) {
          teamsByGames.set(key, []);
        }
        teamsByGames.get(key)!.push(team);
      }

      // Sort groups by games played (fewer = better)
      const sortedGroups = Array.from(teamsByGames.entries()).sort((a, b) => a[0] - b[0]);

      for (const [_, group] of sortedGroups) {
        if (group.length === 1) {
          finalStandings.push(group[0]);
        } else {
          // Article 19.5: Break tie among teams with same wins and games played
          const tiedTeamIds = new Set(group.map((t) => t.team_id));

          // Special case: if only 2 teams, check if they've met twice
          // For more teams, check if all pairs have met twice
          let allMetTwice = false;
          if (group.length === 2) {
            const [team1, team2] = group;
            let gameCount = 0;
            for (const match of finishedMatches) {
              if (
                (match.home_id === team1.team_id && match.away_id === team2.team_id) ||
                (match.home_id === team2.team_id && match.away_id === team1.team_id)
              ) {
                gameCount++;
              }
            }
            allMetTwice = gameCount >= 2;
          } else {
            allMetTwice = haveAllTeamsMetTwice(finishedMatches, tiedTeamIds);
          }

          if (!allMetTwice) {
            // Article 19.5.1: Haven't met or met only once
            const sorted = [...group].sort((a, b) => {
              // a) Goal difference (all games) - HIGHER is better
              if (b.pointDifference !== a.pointDifference) {
                return b.pointDifference - a.pointDifference;
              }

              // Points scored - HIGHER is better
              if (b.pointsFor !== a.pointsFor) {
                return b.pointsFor - a.pointsFor;
              }

              // b) Goal average - HIGHER is better
              const aAvg = calculateGoalAverage(a.pointsFor, a.pointsAgainst);
              const bAvg = calculateGoalAverage(b.pointsFor, b.pointsAgainst);
              return bAvg - aAvg;
            });
            finalStandings.push(...sorted);
          } else {
            // Article 19.5.2: All have met twice
            if (group.length === 2) {
              // Section I: Two teams
              const [team1, team2] = group;
              const result = breakTieTwoTeams(
                finishedMatches,
                team1.team_id,
                team2.team_id,
                team1,
                team2
              );
              if (result > 0) {
                finalStandings.push(team2, team1);
              } else {
                finalStandings.push(team1, team2);
              }
            } else {
              // Section II: More than two teams
              const sorted = breakTieMultipleTeams(finishedMatches, group, teamStats);
              finalStandings.push(...sorted);
            }
          }
        }
      }
    }
  }

  // Calculate positions
  const positionMap = new Map<number, TeamStats>();
  let currentPosition = 1;

  for (let i = 0; i < finalStandings.length; i++) {
    const team = finalStandings[i];

    // Check if this team is different from previous using all criteria
    if (i > 0) {
      const prevTeam = finalStandings[i - 1];
      if (
        prevTeam.wins !== team.wins ||
        prevTeam.gamesPlayed !== team.gamesPlayed ||
        prevTeam.pointDifference !== team.pointDifference ||
        prevTeam.pointsFor !== team.pointsFor
      ) {
        currentPosition = i + 1;
      }
      // If all criteria match, keep same position (true tie)
    }

    positionMap.set(team.team_id, {
      position: currentPosition,
      wins: team.wins,
      gamesPlayed: team.gamesPlayed,
      draws: team.draws,
      losses: team.losses,
      pointsFor: team.pointsFor,
      pointsAgainst: team.pointsAgainst,
      pointDifference: team.pointDifference,
      team_id: team.team_id,
    });
  }

  return positionMap;
}

/**
 * Get standings as a simple position map (team_id -> position)
 * Useful for quick lookups
 * @param matches - Array of match objects
 * @returns Map of team_id to position
 */
export function getTeamPositions(matches: StandingsMatch[]): Map<number, number> {
  const standings = calculateTeamStandings(matches);
  const positionMap = new Map<number, number>();

  for (const [teamId, stats] of Array.from(standings.entries())) {
    if (stats.position !== undefined) {
      positionMap.set(teamId, stats.position);
    }
  }

  return positionMap;
}

/**
 * Get full standings array sorted by position
 * @param matches - Array of match objects
 * @returns Array of team standings
 */
export function getStandingsArray(matches: StandingsMatch[]): TeamStats[] {
  const standings = calculateTeamStandings(matches);
  return Array.from(standings.values()).sort((a, b) => (a.position || 0) - (b.position || 0));
}
