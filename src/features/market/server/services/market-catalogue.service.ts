import 'server-only';
import { getPlayerFormStats } from '@/features/players/server';
import { getAllTeamMatchesCount, getAllTeamsPlayoffProbabilities } from '@/features/teams/server';
import {
  resolveMarketCatalogueSeason,
  readMarketOpportunityCandidates,
  readCurrentMarketListings,
} from '../queries/market-catalogue.query';
import { mapMarketListing, mapMarketOpportunity } from '../mappers/market-catalogue.mapper';
import type { CurrentMarketListing, MarketOpportunity } from '../../models/market-catalogue';

export const MARKET_CATALOGUE_POLICY = Object.freeze({
  access: 'public-fantasy-statistics',
  identity: 'none',
  serverCache: 'none',
} as const);

export async function getMarketOpportunities(limit = 3): Promise<MarketOpportunity[]> {
  const season = await resolveMarketCatalogueSeason();
  const [rows, forms] = await Promise.all([
    readMarketOpportunityCandidates(season),
    getPlayerFormStats(3),
  ]);
  const formMap = new Map(forms.map((form) => [form.playerId, form]));
  return rows
    .map((row) => mapMarketOpportunity(row, formMap.get(Number(row.player_id))))
    .sort((a, b) => b.value_score - a.value_score || b.price_trend - a.price_trend)
    .slice(0, limit);
}

export async function getCurrentMarketListings(): Promise<CurrentMarketListing[]> {
  const season = await resolveMarketCatalogueSeason();
  // Preserve the original helper-before-listing read order and independent season resolution.
  const [probabilities, counts, forms] = await Promise.all([
    getAllTeamsPlayoffProbabilities(),
    getAllTeamMatchesCount(),
    getPlayerFormStats(),
  ]);
  const formMap = new Map(forms.map((form) => [form.playerId, form]));
  return (await readCurrentMarketListings(season))
    .map((row) => mapMarketListing(row, formMap.get(Number(row.player_id)), counts, probabilities))
    .sort((a, b) => {
      if (b.recommendation_score !== a.recommendation_score)
        return b.recommendation_score - a.recommendation_score;
      if (b.price_trend !== a.price_trend) return b.price_trend - a.price_trend;
      return b.price - a.price;
    });
}
