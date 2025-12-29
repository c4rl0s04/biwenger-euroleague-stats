/**
 * UI Components Barrel Export
 * Import UI components from this file for cleaner imports:
 *
 * @example
 * // Instead of:
 * import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
 * import FadeIn from '@/components/ui/FadeIn';
 *
 * // Use:
 * import { LoadingSkeleton, FadeIn } from '@/components/ui';
 */

// Loading & Skeletons
export { default as LoadingSkeleton, CardSkeleton, TableRowSkeleton } from './LoadingSkeleton';

// Animation
export { default as FadeIn } from './FadeIn';

// Cards
export { default as PremiumCard } from './PremiumCard';

// Error Handling
export { default as ErrorBoundary } from './ErrorBoundary';

// User Display
export { default as UserAvatar } from './UserAvatar';

// Theme
export { default as ThemeBackground } from './ThemeBackground';
