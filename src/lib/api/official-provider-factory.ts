import { CONFIG } from '../config';
import { EuroleagueAdvancedProvider } from './euroleague-advanced-client';
import type { OfficialBasketballProvider, OfficialProviderName } from './official-provider';

let cachedProvider: OfficialBasketballProvider | null = null;

export async function getOfficialBasketballProvider(): Promise<OfficialBasketballProvider> {
  if (cachedProvider) return cachedProvider;
  const configured = (process.env.EUROLEAGUE_OFFICIAL_PROVIDER ||
    'advanced') as OfficialProviderName;
  if (configured === 'advanced') {
    cachedProvider = new EuroleagueAdvancedProvider({
      baseUrl: process.env.EUROLEAGUE_ADVANCED_API_URL,
      token: process.env.EUROLEAGUE_ADVANCED_API_TOKEN,
    });
    return cachedProvider;
  }
  if (configured === 'legacy') {
    if (!CONFIG.EUROLEAGUE.SEASON_CODE) {
      throw new Error('EUROLEAGUE_SEASON_CODE is required for the legacy official provider.');
    }
    const { LegacyEuroleagueProvider } = await import('./official-provider-legacy');
    cachedProvider = new LegacyEuroleagueProvider(CONFIG.EUROLEAGUE.SEASON_CODE);
    return cachedProvider;
  }
  throw new Error(`Unsupported EUROLEAGUE_OFFICIAL_PROVIDER=${configured}`);
}

export function resetOfficialProviderForTests() {
  cachedProvider = null;
}
