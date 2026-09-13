import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export function BestAverageCard({ promedios }) {
  if (!promedios || promedios.length === 0) return null;
  const best = promedios[0];
  const progress = Math.min((best.promedio / 10) * 100, 100);

  return (
    <Card title="Mejor Promedio" icon={TrendingUp} color="teal" className="h-full">
      <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-2">
        <Link
          href={`/user/${best.user_id}`}
          className="text-3xl font-black text-teal-500 hover:text-teal-400 transition-colors"
        >
          {best.usuario}
        </Link>

        <div className="flex flex-col items-center">
          <span className="text-4xl font-black text-teal-500">
            {parseFloat(best.promedio).toFixed(2)}
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
            Media
          </span>
        </div>

        <div className="w-full max-w-[80%] space-y-2">
          <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            En <span className="font-bold text-teal-500">{best.jornadas_jugadas}</span> jornadas
          </p>
        </div>
      </div>
    </Card>
  );
}
