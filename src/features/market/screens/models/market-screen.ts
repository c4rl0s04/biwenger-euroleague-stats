import type { MarketActivityKPIs } from '../../trends/models/market-activity';
import type { RecentTransfer } from '../../trends/models/market-activity-extra';
import type { CurrentMarketListing } from '../../catalogue/models/market-catalogue';

/** The phone overview deliberately loads fewer facts than the desktop analytics screen. */
export interface MobileMarketOverview {
  listings: CurrentMarketListing[];
  kpis: MarketActivityKPIs;
  recentTransfers: RecentTransfer[];
}
