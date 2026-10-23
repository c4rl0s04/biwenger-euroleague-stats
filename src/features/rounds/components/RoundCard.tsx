import type { ComponentType, ReactNode } from 'react';
import { Info } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Popover,
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
            <Popover
              label={`Información sobre ${title}`}
              trigger={<Info size={18} aria-hidden />}
              className="inline-flex h-10 w-10 items-center justify-center text-muted-foreground"
            >
              {info}
            </Popover>
          ) : undefined
        }
      >
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
