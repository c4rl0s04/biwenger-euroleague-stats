import { Star, Crown } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export function Perfect10Card({ achievements }) {
  const perfects = achievements?.perfect_10 || [];

  if (perfects.length === 0) {
    return (
      <Card title="Perfect 10" icon={Star} color="yellow" className="h-full">
        <div className="flex flex-col items-center justify-center h-full min-h-[150px] text-center p-4">
          <p className="text-sm text-muted-foreground">Nadie ha logrado un 10/10 todavía</p>
        </div>
      </Card>
    );
  }

  const cleanRoundName = (name) => {
    return name
      .replace(/Regular Season\s*/i, '')
      .replace(/Round/i, 'Jornada')
      .replace(/\s*\(.*?\)/g, '')
      .trim();
  };

  const displayItems = perfects.slice(0, 5);
  const isCrowded = displayItems.length > 2;

  return (
    <Card title="Club Perfect 10" icon={Star} color="yellow">
      <div className="flex flex-col items-center justify-center h-full gap-6 py-4">
        {displayItems.map((p, idx) => (
          <div key={idx} className="flex flex-col items-center text-center w-full">
            <Crown className="w-8 h-8 text-yellow-500 mb-2 fill-yellow-500/20" />
            <Link
              href={`/user/${p.user_id}`}
              className="text-2xl sm:text-3xl font-black text-yellow-500 hover:text-yellow-400 transition-colors tracking-tighter drop-shadow-sm px-2 break-all"
            >
              {p.usuario}
            </Link>
            <span className="text-sm font-bold text-yellow-500/80 uppercase tracking-widest mt-1">
              {cleanRoundName(p.jornada)}
            </span>
            {idx < displayItems.length - 1 && (
              <div className="w-12 h-px bg-yellow-500/20 mt-4 rounded-full" />
            )}
          </div>
        ))}
        {perfects.length > 5 && (
          <p className="text-xs font-bold text-yellow-500/60 text-center uppercase tracking-widest pt-2">
            +{perfects.length - 5} más
          </p>
        )}
      </div>
    </Card>
  );
}
