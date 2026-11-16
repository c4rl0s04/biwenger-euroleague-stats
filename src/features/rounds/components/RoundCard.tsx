import type { ComponentType, ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  type CardDensity,
} from '@/components/ui/foundation';

export const roundAccent: Record<string, string> = {
  orange: 'text-primary',
  primary: 'text-primary',
  zinc: 'text-muted-foreground',
  emerald: 'text-[var(--round-ideal)]',
  green: 'text-[var(--round-ideal)]',
  purple: 'text-[var(--round-global)]',
  indigo: 'text-[var(--round-global)]',
  blue: 'text-[var(--round-info)]',
  cyan: 'text-[var(--round-info)]',
  yellow: 'text-[var(--round-record)]',
  amber: 'text-[var(--round-record)]',
  red: 'text-[var(--round-danger)]',
};
export function RoundCard({
  title,
  icon: Icon,
  color = 'zinc',
  children,
  className,
  info,
  density = 'comfortable',
}: {
  title: string;
  icon?: ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
  color?: string;
  children: ReactNode;
  className?: string;
  info?: string;
  density?: CardDensity;
  bgColor?: string;
}) {
  return (
    <Card className={className} density={density}>
      <CardHeader
        icon={
          Icon ? (
            <Icon size={20} className={roundAccent[color] ?? roundAccent.zinc} aria-hidden />
          ) : undefined
        }
        action={
          info ? (
            <details className="relative">
              <summary
                aria-label={`Información sobre ${title}`}
                className="cursor-pointer list-none rounded p-1 text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Info size={18} aria-hidden />
              </summary>
              <p className="absolute right-0 top-full z-30 mt-2 w-64 max-w-[70vw] rounded-lg border border-border bg-popover p-3 text-sm text-foreground shadow-lg">
                {info}
              </p>
            </details>
          ) : undefined
        }
      >
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
