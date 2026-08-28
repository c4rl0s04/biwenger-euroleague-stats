import { EuroleagueClient } from './client';

let runtimeClient: EuroleagueClient | null = null;

export function getEuroleagueClient(): EuroleagueClient {
  if (!runtimeClient) {
    runtimeClient = new EuroleagueClient({
      baseUrl: process.env.EUROLEAGUE_ADVANCED_API_URL,
      token: process.env.EUROLEAGUE_ADVANCED_API_TOKEN,
    });
  }
  return runtimeClient;
}

export function resetEuroleagueClientForTests(): void {
  runtimeClient = null;
}
