import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/foundation';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { roundAccent } from '../../../RoundCard';

export default function HistoryStatCard({
  title,
  value,
  subValue,
  icon: Icon,
  color = 'blue',
  trend = null,
}) {
  return (
    <Card density="compact" className="h-full">
      <CardHeader
        icon={
          Icon ? (
            <Icon size={16} className={roundAccent[color] || roundAccent.zinc} aria-hidden />
          ) : undefined
        }
      >
        <CardTitle as="h4">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span
            className={`text-3xl font-bold tabular-nums ${roundAccent[color] || roundAccent.zinc}`}
          >
            {value ?? '/'}
          </span>
          {trend && (
            <span aria-label={trend === 'up' ? 'En aumento' : 'En descenso'}>
              {trend === 'up' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            </span>
          )}
        </div>
        {subValue && <p className="mt-1 text-xs text-muted-foreground">{subValue}</p>}
      </CardContent>
    </Card>
  );
}
