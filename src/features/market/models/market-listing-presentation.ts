import type { PlayerProfileApiModel } from '@/features/players/public';
import type { CurrentMarketListing } from './market-catalogue';

/** Explicit legacy presentation fallbacks, not new fields in the listing response. */
export interface MarketListingPresentation extends CurrentMarketListing {
  average?: number | string | null;
  owner_id?: number | string | null;
  owner_name?: string | null;
  owner_color_index?: number | null;
}

/** Type-only view of the existing hook; no request, transform or cache behavior is added. */
export type UseMarketPlayerDetails = (
  endpoint: () => string,
  options: { skip: boolean }
) => { data: PlayerProfileApiModel | null | undefined; loading: boolean };
