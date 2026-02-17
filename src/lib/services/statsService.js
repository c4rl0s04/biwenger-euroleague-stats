import { getAllTournaments } from './tournamentService';
import { getTournamentFixtures, getTournamentStandings } from '@/lib/db';

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
  const hallOfFame = {};

  allTournaments.forEach((t) => {
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

  // 2. Global Record (W-D-L from ALL fixtures)
  // We need a map of all users first to ensure we have names/icons
  const userMap = {};

  // Initialize userMap from standings (which has user info) or fixtures
  // Helper to init user stats
  const initUser = (id, name, icon) => {
    if (!userMap[id]) {
      userMap[id] = {
        id,
        name,
        icon,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,
        ga: 0,
        points: 0, // Virtual points (W=3, D=1)
      };
    }
  };

  fixtures.forEach((f) => {
    if (f.status !== 'finished' && !f.home_score && !f.away_score) return;

    // Skip fixtures with "Ghost" users (id=0 or null) unless we want them?
    // Usually valid users have IDs.

    // Process Home
    if (f.home_user_id) {
      initUser(f.home_user_id, f.home_user_name, f.home_user_icon);
      const stats = userMap[f.home_user_id];
      stats.played++;
      stats.gf += f.home_score || 0;
      stats.ga += f.away_score || 0;

      if ((f.home_score || 0) > (f.away_score || 0)) {
        stats.won++;
        stats.points += 3;
      } else if ((f.home_score || 0) === (f.away_score || 0)) {
        stats.drawn++;
        stats.points += 1;
      } else {
        stats.lost++;
      }
    }

    // Process Away
    if (f.away_user_id) {
      initUser(f.away_user_id, f.away_user_name, f.away_user_icon);
      const stats = userMap[f.away_user_id];
      stats.played++;
      stats.gf += f.away_score || 0;
      stats.ga += f.home_score || 0;

      if ((f.away_score || 0) > (f.home_score || 0)) {
        stats.won++;
        stats.points += 3;
      } else if ((f.away_score || 0) === (f.home_score || 0)) {
        stats.drawn++;
        stats.points += 1;
      } else {
        stats.lost++;
      }
    }
  });

  const globalStatsList = Object.values(userMap).sort((a, b) => {
    // Sort by Points, then GD, then GF
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    return b.gf - a.gf;
  });

  // 3. League Classification (Only League Tournaments)
  // We can trust our "type" field now!
  const leagueTournaments = allTournaments.filter((t) => t.type === 'league').map((t) => t.id);
  const leagueIds = new Set(leagueTournaments);

  const leagueStatsMap = {};

  standings.forEach((s) => {
    if (!leagueIds.has(s.tournament_id)) return;

    if (!leagueStatsMap[s.user_id]) {
      leagueStatsMap[s.user_id] = {
        id: s.user_id,
        name: s.user_name,
        icon: s.user_icon,
        points: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        scored: 0,
        against: 0,
      };
    }

    const st = leagueStatsMap[s.user_id];
    st.points += s.points;
    st.won += s.won;
    st.drawn += s.drawn;
    st.lost += s.lost;
    st.scored += s.scored;
    st.against += s.against;
  });

  const leagueStatsList = Object.values(leagueStatsMap).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.scored - a.against;
    const gdB = b.scored - b.against;
    return gdB - gdA;
  });

  return {
    hallOfFame: hallOfFameList,
    globalStats: globalStatsList,
    leagueStats: leagueStatsList,
  };
}
