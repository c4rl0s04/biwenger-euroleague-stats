import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Surface, type SurfaceProps } from '../primitives/Surface';

export type CardDensity = 'comfortable' | 'compact';
export type CardProps = SurfaceProps & { density?: CardDensity };
export type CardHeaderProps = HTMLAttributes<HTMLDivElement> & {
  icon?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
};
export type CardTitleElement = 'h2' | 'h3' | 'h4';
export type CardTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  as?: CardTitleElement;
};
export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;
export type CardContentProps = HTMLAttributes<HTMLDivElement>;
export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

/** Root padding and gap keep density local, including independently nested cards. */
export function Card({ density = 'comfortable', className, ...props }: CardProps) {
  return (
    <Surface
      className={cn(
        'flex min-w-0 flex-col',
        density === 'compact' ? 'gap-4 p-4' : 'gap-6 p-6',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  icon,
  eyebrow,
  action,
  children,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div className={cn('flex flex-wrap items-start gap-3', className)} {...props}>
      {icon != null ? <div className="shrink-0 text-muted-foreground">{icon}</div> : null}
      <div className="min-w-0 flex-1 space-y-1.5 wrap-break-word">
        {eyebrow != null ? (
          <div className="text-xs font-medium text-muted-foreground">{eyebrow}</div>
        ) : null}
        {children}
      </div>
      {action != null ? <div className="ml-auto max-w-full shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardTitle({ as: Heading = 'h3', className, ...props }: CardTitleProps) {
  return (
    <Heading
      // Unlayered legacy h1/h2/h3 rules otherwise override Tailwind typography.
      className={cn(
        'font-sans! text-base font-semibold tracking-normal! normal-case! text-foreground',
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cn('min-w-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: CardFooterProps) {
  return <div className={cn('flex flex-wrap items-center gap-3', className)} {...props} />;
}
