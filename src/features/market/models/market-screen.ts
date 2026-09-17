import type { MarketActivityKPIs } from './market-activity';
import type { RecentTransfer } from './market-activity-extra';
import type { CurrentMarketListing } from './market-catalogue';

/** The phone overview deliberately loads fewer facts than the desktop analytics screen. */
export interface MobileMarketOverview {
  listings: CurrentMarketListing[];
  kpis: MarketActivityKPIs;
  recentTransfers: RecentTransfer[];
}
