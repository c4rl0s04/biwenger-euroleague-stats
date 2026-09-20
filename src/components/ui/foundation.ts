// Temporary opt-in entrypoint: the existing UI barrel retains the legacy Card.
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
