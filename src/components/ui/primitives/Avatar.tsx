import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  alt?: string;
  fallback?: ReactNode;
  size?: AvatarSize;
}

const avatarSizes: Record<AvatarSize, { frame: string; text: string }> = {
  sm: { frame: 'h-8 w-8', text: 'text-xs' },
  md: { frame: 'h-10 w-10', text: 'text-sm' },
  lg: { frame: 'h-12 w-12', text: 'text-base' },
};

export function Avatar({ src, alt, fallback, size = 'md', className, ...props }: AvatarProps) {
  const { frame, text } = avatarSizes[size] || avatarSizes.md;

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-[hsl(var(--surface-secondary))] font-sans font-medium text-muted-foreground select-none',
        frame,
        text,
        className
      )}
      role={!src && alt ? 'img' : undefined}
      aria-label={!src && alt ? alt : undefined}
      {...props}
    >
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={alt ?? ''}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        fallback
      )}
    </span>
  );
}
