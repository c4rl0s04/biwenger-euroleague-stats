import 'server-only';

import { getAllTournaments } from './tournamentService';
import { getTournamentFixtures, getTournamentStandings } from '../db';

export interface HallOfFameEntry {
  id: number;
  name: string;
  icon: string;
  titles: number;
  tournaments: string[];
}

export interface GlobalUserStats {
  id: number;
  name: string;
  icon: string;
  colorIndex: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  points: number;
  form: string[];
  currentStreak: number;
  longestStreak: number;
  signedStreak: number;
  scored?: number; // Used in league stats
  against?: number; // Used in league stats
}

/**
 * Calculates global statistics for the tournaments page.
 * Aggregates data from all tournaments, fixtures, and standings.
 */
export async function getGlobalTournamentStats() {
  const [tournamentsData, fixtures, standings] = await Promise.all([
    getAllTournaments(),
    getTournamentFixtures(null),
    getTournamentStandings(null),
  ]);

  const { all: allTournaments } = tournamentsData;

  // 1. Hall of Fame (Most Titles)
  const hallOfFame: Record<number, HallOfFameEntry> = {};

  allTournaments.forEach((t: any) => {
    // Check both potential winner locations
    const winner = t.data?.winner || (t.status === 'finished' && t.winner ? t.winner : null);

    if (winner && winner.id) {
      if (!hallOfFame[winner.id]) {
        hallOfFame[winner.id] = {
          id: winner.id,
          name: winner.name,
          icon: winner.icon,
          titles: 0,
          tournaments: [],
        };
      }
      hallOfFame[winner.id].titles += 1;
      hallOfFame[winner.id].tournaments.push(t.name);
    }
  });

  // Convert to array and sort by titles DESC
  const hallOfFameList = Object.values(hallOfFame).sort((a, b) => b.titles - a.titles);

  // 2. Global Record (W-D-L from ALL fixtures) & Records
  const userMap: Record<number, GlobalUserStats> = {};

  // Records Containers
  let biggestWin = { diff: 0, match: null as any };
  let highestScoring = { total: 0, match: null as any };
  const longestStreakGlobal = { count: 0, user: null as any };

  // Helper to init user stats
  const initUser = (id: number, name: string, icon: string, colorIndex: number) => {
    if (!userMap[id]) {
      userMap[id] = {
        id,
        name,
        icon,
        colorIndex,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        points: 0, // W=3, D=1
        form: [], // Will store W, D, L
        currentStreak: 0,
        longestStreak: 0,
        signedStreak: 0,
      };
    }
  };

  // Sort fixtures chronologically (ASC) for streak calculation
  const sortedFixtures = [...fixtures].sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedFixtures.forEach((f: any) => {
    if (f.status !== 'finished' && !f.home_score && !f.away_score) return;

    const homeScore = f.home_score || 0;
    const awayScore = f.away_score || 0;
    const totalPoints = homeScore + awayScore;
    const diff = Math.abs(homeScore - awayScore);

    // Track Highest Scoring Match
    if (totalPoints > highestScoring.total) {
      highestScoring = { total: totalPoints, match: f };
    }

    // Track Biggest Win (Only if both scored > 0 to avoid ghost matches)
    if (diff > biggestWin.diff && homeScore > 0 && awayScore > 0) {
      biggestWin = { diff, match: f };
    }

    // Process Home
    if (f.home_user_id) {
      initUser(f.home_user_id, f.home_user_name, f.home_user_icon, f.home_user_color);
      const stats = userMap[f.home_user_id];
      stats.played++;
      stats.gf += homeScore;
      stats.ga += awayScore;

      if (homeScore > awayScore) {
        stats.won++;
        stats.points += 3;
        stats.form.push('W');
        stats.currentStreak++;
        stats.signedStreak = stats.signedStreak > 0 ? stats.signedStreak + 1 : 1;
        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
      } else if (homeScore === awayScore) {
        stats.drawn++;
        stats.points += 1;
        stats.form.push('D');
        stats.currentStreak = 0;
        stats.signedStreak = 0;
      } else {
        stats.lost++;
        stats.form.push('L');
        stats.currentStreak = 0;
        stats.signedStreak = stats.signedStreak < 0 ? stats.signedStreak - 1 : -1;
      }
    }

    // Process Away
    if (f.away_user_id) {
      initUser(f.away_user_id, f.away_user_name, f.away_user_icon, f.away_user_color);
      const stats = userMap[f.away_user_id];
      stats.played++;
      stats.gf += awayScore;
      stats.ga += homeScore;

      if (awayScore > homeScore) {
        stats.won++;
        stats.points += 3;
        stats.form.push('W');
        stats.currentStreak++;
        stats.signedStreak = stats.signedStreak > 0 ? stats.signedStreak + 1 : 1;
        if (stats.currentStreak > stats.longestStreak) {
          stats.longestStreak = stats.currentStreak;
        }
      } else if (awayScore === homeScore) {
        stats.drawn++;
        stats.points += 1;
        stats.form.push('D');
        stats.currentStreak = 0;
        stats.signedStreak = 0;
      } else {
        stats.lost++;
        stats.form.push('L');
        stats.currentStreak = 0;
        stats.signedStreak = stats.signedStreak < 0 ? stats.signedStreak - 1 : -1;
      }
    }
  });

  // Final Processing for Global Stats
  const globalStatsList = Object.values(userMap)
    .map((user) => {
      // Keep only last 5 form results
      user.form = user.form.slice(-5);

      // Update global longest streak record
      if (user.longestStreak > longestStreakGlobal.count) {
        longestStreakGlobal.count = user.longestStreak;
        longestStreakGlobal.user = {
          id: user.id,
          name: user.name,
          icon: user.icon,
          colorIndex: user.colorIndex,
        };
      }

      return user;
    })
    .sort((a, b) => {
      // Sort by Points, then GD, then GF
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.gf - a.ga;
      const gdB = b.gf - b.ga;
      if (gdB !== gdA) return gdB - gdA;
      return b.gf - a.gf;
    });

  const records = {
    biggestWin: biggestWin.match
      ? {
          diff: biggestWin.diff,
          match: biggestWin.match,
          winner:
            biggestWin.match.home_score > biggestWin.match.away_score
              ? {
                  id: biggestWin.match.home_user_id,
                  name: biggestWin.match.home_user_name,
                  icon: biggestWin.match.home_user_icon,
                  colorIndex: biggestWin.match.home_user_color,
                }
              : {
                  id: biggestWin.match.away_user_id,
                  name: biggestWin.match.away_user_name,
                  icon: biggestWin.match.away_user_icon,
                  colorIndex: biggestWin.match.away_user_color,
                },
          loser:
            biggestWin.match.home_score > biggestWin.match.away_score
              ? {
                  id: biggestWin.match.away_user_id,
                  name: biggestWin.match.away_user_name,
                  icon: biggestWin.match.away_user_icon,
                  colorIndex: biggestWin.match.away_user_color,
                }
              : {
                  id: biggestWin.match.home_user_id,
                  name: biggestWin.match.home_user_name,
                  icon: biggestWin.match.home_user_icon,
                  colorIndex: biggestWin.match.home_user_color,
                },
          score: `${Math.max(biggestWin.match.home_score, biggestWin.match.away_score)} - ${Math.min(biggestWin.match.home_score, biggestWin.match.away_score)}`,
        }
      : null,
    highestScoring: highestScoring.match
      ? {
          total: highestScoring.total,
          match: {
            ...highestScoring.match,
            home_user: {
              id: highestScoring.match.home_user_id,
              name: highestScoring.match.home_user_name,
              icon: highestScoring.match.home_user_icon,
              colorIndex: highestScoring.match.home_user_color,
            },
            away_user: {
              id: highestScoring.match.away_user_id,
              name: highestScoring.match.away_user_name,
              icon: highestScoring.match.away_user_icon,
              colorIndex: highestScoring.match.away_user_color,
            },
          },
          score: `${highestScoring.match.home_score} - ${highestScoring.match.away_score}`,
        }
      : null,
    longestStreak: longestStreakGlobal.count > 0 ? longestStreakGlobal : null,
  };

  // 3. League Classification (Only League Tournaments)
  // We can trust our "type" field now!
  const leagueTournaments = allTournaments.filter((t: any) => t.type === 'league').map((t: any) => t.id);
  const leagueIds = new Set(leagueTournaments);

  const leagueStatsMap: Record<number, GlobalUserStats> = {};

  standings.forEach((s: any) => {
    if (!leagueIds.has(s.tournament_id)) return;

    if (!leagueStatsMap[s.user_id]) {
      leagueStatsMap[s.user_id] = {
        id: s.user_id,
        name: s.user_name,
        icon: s.user_icon,
        colorIndex: s.user_color,
        played: 0,
        points: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        scored: 0,
        against: 0,
        gf: 0,
        ga: 0,
        form: [],
        currentStreak: 0,
        longestStreak: 0,
        signedStreak: 0,
      };
    }

    const st = leagueStatsMap[s.user_id];
    st.points += s.points;
    st.won += s.won;
    st.drawn += s.drawn;
    st.lost += s.lost;
    st.played += s.won + s.drawn + s.lost;
    st.scored = (st.scored || 0) + s.scored;
    st.against = (st.against || 0) + s.against;
  });

  const leagueStatsList = Object.values(leagueStatsMap).sort((a: any, b: any) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = (a.scored || 0) - (a.against || 0);
    const gdB = (b.scored || 0) - (b.against || 0);
    return gdB - gdA;
  });

  return {
    hallOfFame: hallOfFameList,
    globalStats: globalStatsList,
    leagueStats: leagueStatsList,
    records,
  };
}
