import type { ReactNode } from 'react';
import type { MarketDrawerFieldView, MarketDrawerRowProps } from './market-drawer';

/** Known legacy aliases supported by the renderer; never an arbitrary record dictionary.
 * Current service DTOs remain the category-specific drawer inputs. These aliases preserve
 * existing fallback behavior inside rendering, not additional fields in HTTP responses.
 */
export interface MarketMetricFields extends MarketDrawerFieldView {
  price?: number | null;
  team?: string | null;
  user_img?: string | null;
  image?: string | null;
  user_color?: number | null;
  comprador_id?: string | number | null;
  comprador_color_index?: number | null;
  vendedor_id?: string | number | null;
  vendedor_color_index?: number | null;
  managerId?: string | number | null;
  managerName?: string | null;
}

export type MarketMetricCategory = 'PLAYER' | 'USER' | 'TRANSACTION' | 'TEMPORAL';
type MetricContent = ReactNode | ((item: MarketMetricFields) => ReactNode);
type MetricLabel = string | ((item: MarketMetricFields) => string);

export interface MarketMetricDefinition {
  id: string;
  match: (item: MarketMetricFields) => boolean | string | null | undefined;
  label: MetricLabel;
  value: MetricContent;
  sub?: MetricContent;
  info?: MetricContent;
  summary?: {
    key: keyof MarketMetricFields | ((item: MarketMetricFields) => number | null | undefined);
    label: MetricLabel;
    type: 'currency' | 'number';
  };
}

export interface MarketMetricRowProps extends Omit<MarketDrawerRowProps, 'item'> {
  item: MarketMetricFields;
}

interface MarketRowColor {
  text: string;
  bg?: string;
  border?: string;
}

export interface MarketRowIdentity {
  // Preserve the old truthy ID value rather than coercing it to a boolean.
  isUser: boolean | string | number | null | undefined;
  imageSrc: string | null | undefined;
  name: string | null | undefined;
  linkId: string | number | null | undefined;
  linkPath: string;
  primaryColor: MarketRowColor;
  secondaryColor: MarketRowColor;
  managerName: string | null | undefined;
  managerId: string | number | null | undefined;
}

/** Type-only adapter for the unchanged shared visual implementation (C13 ownership). */
export interface MarketBaseRowProps extends MarketRowIdentity {
  rank: number;
  isTop3: boolean;
  idx: number;
  valueLabel: ReactNode;
  valueText: ReactNode;
  valueSub?: ReactNode;
  children?: ReactNode;
}
