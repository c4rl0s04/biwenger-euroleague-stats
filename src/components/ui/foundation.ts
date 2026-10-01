// Opt-in foundation entrypoint: the existing UI barrel (@/components/ui) retains legacy components.
export { Surface, type SurfaceProps, type SurfaceVariant } from './primitives/Surface';
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  type CardProps,
  type CardDensity,
  type CardHeaderProps,
  type CardTitleProps,
  type CardTitleElement,
  type CardDescriptionProps,
  type CardContentProps,
  type CardFooterProps,
} from './compositions/Card';
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from './primitives/Button';
export { IconButton, type IconButtonProps } from './primitives/IconButton';
export { Badge, type BadgeProps, type BadgeVariant } from './primitives/Badge';
export { Avatar, type AvatarProps, type AvatarSize } from './primitives/Avatar';
export { Input, type InputProps } from './primitives/Input';
export { Skeleton, type SkeletonProps } from './primitives/Skeleton';
export { EmptyState } from './compositions/EmptyState';
export { PageHeader, type PageHeaderProps } from './compositions/PageHeader';
export { PageCanvas, type PageCanvasProps } from './compositions/PageCanvas';
export {
  PageSection,
  type PageSectionProps,
  type PageSectionTone,
} from './compositions/PageSection';
export { SectionHeader, type SectionHeaderProps } from './compositions/SectionHeader';
export { ModalDialog, type ModalDialogProps } from './controls/ModalDialog';
export {
  SearchableSelect,
  type SearchableOption,
  type SearchableSelectProps,
} from './controls/SearchableSelect';
