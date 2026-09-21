import 'server-only';
// Temporary News/Home ownership until Tasks 08/09. No Dashboard aggregation lives here.
import {
  getSimpleStandings as getStandings,
  getCurrentRoundState,
  getRecentTransfers,
  getSignificantPriceChanges,
  getUpcomingMatches,
  getRecentResults,
} from '../../db';
import { CONFIG } from '../../config';

export async function fetchLandingStats() {
  const standings = await getStandings();
  const userCount = standings?.length || 0;

  const { currentRound } = await getCurrentRoundState();
  let roundNumber = 0;

  if (currentRound && currentRound.round_name) {
    const match = currentRound.round_name.match(/\d+/);
    if (match) {
      roundNumber = parseInt(match[0], 10);
    }
  }

  const PLAYOFF_START_ROUND = 39;
  let weeksToPlayoffs = 0;
  if (roundNumber > 0) {
    weeksToPlayoffs = Math.max(0, PLAYOFF_START_ROUND - roundNumber);
  }

  return {
    seasonName: CONFIG.SEASON.NAME,
    userCount,
    currentRound: currentRound?.round_name || 'Pre-Season',
    weeksToPlayoffs,
    playoffStartRound: PLAYOFF_START_ROUND,
  };
}

export interface NewsFeedItem {
  type: string;
  text: string;
  timestamp: number;
}

/**
 * Fetch aggregated news feed for the ticker
 * Combines recent transfers, price changes, upcoming matches, and recent results.
 * @returns Sorted list of news items
 */
export async function fetchNewsFeed(): Promise<NewsFeedItem[]> {
  const news: NewsFeedItem[] = [];

  // 1. Transfers
  try {
    const transfers = await getRecentTransfers(5);
    transfers.forEach((t: any) => {
      const amount = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(t.precio);
      news.push({
        type: 'transfer',
        text: `FICHAJE: ${t.player_name} (${t.position}) pasa de ${t.vendedor || 'Mercado'} a ${t.comprador || 'Mercado'} por ${amount}`,
        timestamp: t.timestamp,
      });
    });
  } catch (e) {
    console.error('Error fetching transfers:', e);
  }

  // 2. Price Changes
  try {
    const priceChanges = await getSignificantPriceChanges(24, 200000);
    priceChanges.forEach((c: any) => {
      const amount = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(Math.abs(c.price_increment));
      const direction = c.price_increment > 0 ? 'sube' : 'baja';
      news.push({
        type: c.price_increment > 0 ? 'price_up' : 'price_down',
        text: `MERCADO: ${c.name} ${direction} ${amount} hoy`,
        timestamp: Date.now(),
      });
    });
  } catch (e) {
    console.error('Error fetching price changes:', e);
  }

  // 3. Upcoming Matches (3)
  try {
    const matches = await getUpcomingMatches(3);
    matches.forEach((m: any) => {
      const date = new Date(m.date);
      const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const day = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
      news.push({
        type: 'match',
        text: `PRÓXIMO: ${m.home_team} vs ${m.away_team} (${day} ${time})`,
        timestamp: new Date(m.date).getTime(),
      });
    });
  } catch (e) {
    console.error('Error fetching upcoming matches:', e);
  }

  // 4. Recent Results (3)
  try {
    const results = await getRecentResults(3);
    results.forEach((m: any) => {
      news.push({
        type: 'result',
        text: `RESULTADO: ${m.home_team} ${m.home_score} - ${m.away_score} ${m.away_team}`,
        timestamp: new Date(m.date).getTime(),
      });
    });
  } catch (e) {
    console.error('Error fetching results:', e);
  }

  // Random shuffle
  return news.sort(() => 0.5 - Math.random());
}
