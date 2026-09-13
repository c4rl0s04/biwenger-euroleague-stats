import type { LucideIcon } from 'lucide-react';
import type { ManagerDirectoryViewModel } from '@/features/managers/public';
import type { MarketAnalytics } from './market-analytics';

/** Client-local UI state, not a server response (the icon is a component reference). */
export interface MarketDrawerRowsByType {
  player: MarketAnalytics['bestValue' | 'topPlayer' | 'mostOwners' | 'infirmary'];
  user: MarketAnalytics[ // Existing profit/trade dispatch supports this shape, though no current card opens it.
    | 'topTrader'
    | 'bigSpender'
    | 'bestSeller'
    | 'theThief'
    | 'theVictim'
    | 'overpayerManager'];
  transaction: MarketAnalytics['recordTransfer' | 'recordBid' | 'biggestSteal' | 'inflatedPlayer'];
  temporal: MarketAnalytics[
    | 'bestFlip'
    | 'bestRevaluation'
    | 'bestPercentage'
    | 'worstFlip'
    | 'worstRevaluation'
    | 'missedOpportunity'
    | 'quickestFlip'
    | 'longestHold'];
}

export type MarketDrawerType = keyof MarketDrawerRowsByType;
export type MarketDrawerItem = MarketDrawerRowsByType[MarketDrawerType][number];
type UnionKeys<T> = T extends unknown ? keyof T : never;
type UnionValue<T, K extends PropertyKey> = T extends unknown
  ? K extends keyof T
    ? T[K]
    : never
  : never;

/** Internal read-only field view for the existing presence-based renderer dispatch.
 * Input props retain their category-specific records; this does not create a new data DTO.
 */
export type MarketDrawerFieldView = {
  [K in UnionKeys<MarketDrawerItem>]?: UnionValue<MarketDrawerItem, K>;
};

interface MarketDrawerOptions {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  color?:
    | 'blue'
    | 'emerald'
    | 'rose'
    | 'amber'
    | 'indigo'
    | 'fuchsia'
    | 'cyan'
    | 'orange'
    | 'teal'
    | 'red'
    | 'pink'
    | 'purple';
  showFilters?: boolean;
  showSummary?: boolean;
}

export type MarketDrawerConfig = MarketDrawerOptions &
  {
    [K in MarketDrawerType]: { statType: K; data?: MarketDrawerRowsByType[K] };
  }[MarketDrawerType];

export type MarketDrawerState = MarketDrawerConfig & { isOpen: boolean };
export type MarketDrawerProps = MarketDrawerState & {
  onClose: () => void;
  allUsers?: ManagerDirectoryViewModel[];
};

export interface MarketDrawerRowProps {
  item: MarketDrawerFieldView;
  localIdx: number;
  globalIdx: number;
  statType: MarketDrawerType;
}
