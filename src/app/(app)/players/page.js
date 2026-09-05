/**
 * Players Page
 *
 * Player discovery, search, and analysis.
 *
 * See PAGE_ARCHITECTURE.md section 3 for full layout specification.
 */

import {
  getPlayerCatalogueData,
  parsePlayerCatalogueFilters,
  PlayersScreen,
} from '@/features/players/server';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const dynamic = 'force-dynamic';

export default async function PlayersPage({ searchParams }) {
  const [players, phone, params] = await Promise.all([
    getPlayerCatalogueData(),
    isPhonePresentation(),
    searchParams,
  ]);
  const { query, position } = parsePlayerCatalogueFilters(params);
  return <PlayersScreen players={players} phone={phone} query={query} position={position} />;
}
