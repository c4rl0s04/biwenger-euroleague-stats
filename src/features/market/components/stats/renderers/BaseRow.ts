'use client';

/**
 * Market-specific BaseRow re-export.
 * This ensures compatibility with existing market renderers while centralizing
 * the visual template in the global UI library.
 */
import BaseRow from '@/components/ui/BaseRow';
import type { ComponentType } from 'react';
import type { MarketBaseRowProps } from '../../../models/market-metric';

export default BaseRow as ComponentType<MarketBaseRowProps>;
