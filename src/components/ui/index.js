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
export { default as AnimatedNumber, AnimatedCounter } from './AnimatedNumber';

// Cards
export { default as Card } from './Card';

// Error Handling
export { default as ErrorBoundary } from './ErrorBoundary';

// User Display
export { default as UserAvatar } from './UserAvatar';

// Theme
export { default as ThemeBackground } from './ThemeBackground';
export { default as BackButton } from './BackButton';
export { default as Subheading } from './Subheading';
export { default as PageHeader } from './PageHeader';

// Layout & Structure
export { default as Drawer } from './Drawer';
export { default as BaseRow } from './BaseRow';
export { default as StatsList } from './StatsList';
export {
  default as StatsTable,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableIdentity,
} from './StatsTable';
