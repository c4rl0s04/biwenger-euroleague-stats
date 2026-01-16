import { Trophy, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export function VictoriasCard({ victorias, onClick }) {
  if (!victorias || victorias.length === 0) return null;
  const topWinner = victorias[0];

  return (
    <Card
      title="Más Victorias"
      icon={Trophy}
      color="purple"
      className="h-full cursor-pointer hover:border-purple-500/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex flex-col items-center h-full text-center py-2">
        <div className="flex-1 flex flex-col items-center justify-center gap-4 w-full">
          <Link
            href={`/user/${topWinner.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-3xl font-black text-purple-500 hover:text-purple-400 transition-colors"
          >
            {topWinner.usuario}
          </Link>

          <div className="flex flex-col items-center">
            <span className="text-4xl font-black text-purple-500">{topWinner.victorias}</span>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">
              Victorias
            </p>
          </div>
        </div>

        <div className="mt-auto pt-2 flex items-center justify-center text-xs text-muted-foreground group">
          <span className="group-hover:text-purple-500 transition-colors font-medium flex items-center gap-1">
            Ver ranking <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Card>
  );
}
