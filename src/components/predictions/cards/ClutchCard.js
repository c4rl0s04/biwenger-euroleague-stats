import { Zap, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function ClutchCard({ clutchStats, onClick }) {
  if (!clutchStats || clutchStats.length === 0) return null;
  const topClutch = clutchStats[0];

  return (
    <Card
      title="Clutch Player"
      icon={Zap}
      color="orange"
      className="h-full cursor-pointer hover:border-orange-500/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col items-center h-full text-center py-2">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
          <Link
            href={`/user/${topClutch.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-3xl font-black text-orange-500 hover:text-orange-400 transition-colors"
          >
            {topClutch.usuario}
          </Link>

          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-orange-500">
              {parseFloat(topClutch.avg_last_3).toFixed(2)}
            </span>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
              Media últ. 3 jornadas
            </p>
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-center text-xs text-muted-foreground group">
          <span className="group-hover:text-orange-500 transition-colors font-medium flex items-center gap-1">
            Ver ranking <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Card>
  );
}
