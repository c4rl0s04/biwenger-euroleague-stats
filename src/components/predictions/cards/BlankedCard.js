import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import Link from 'next/link';

export function BlankedCard({ achievements }) {
  const blanked = achievements?.blanked || [];

  if (blanked.length === 0) return null;

  // If the worst score is 0, we keep calling it "Blanked". If it's > 0, we call it "Peor Resultado".
  const worstScore = blanked[0].aciertos;
  const isZero = worstScore === 0;
  const title = isZero ? 'Blanked' : 'Farolillo Rojo';

  const cleanRoundName = (name) => {
    return name
      .replace(/Regular Season\s*/i, '')
      .replace(/Round/i, 'Jornada')
      .replace(/\s*\(.*?\)/g, '')
      .trim();
  };

  const displayItems = blanked.slice(0, 5);
  const isCrowded = displayItems.length > 2;
  const nameSizeClass = isCrowded ? 'text-xl' : 'text-2xl';

  return (
    <Card title={title} icon={AlertCircle} color="red" className="h-full">
      <div className="flex flex-col gap-4 py-2">
        {!isZero && (
          <p className="text-xs font-medium text-red-500 uppercase tracking-wider w-full text-center border-b border-red-500/20 pb-2">
            ({worstScore} {worstScore === 1 ? 'acierto' : 'aciertos'})
          </p>
        )}

        {displayItems.map((b, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center text-center pb-3 border-b border-border/50 last:border-0 last:pb-0"
          >
            <Link
              href={`/user/${b.user_id}`}
              className={`${nameSizeClass} font-black text-red-500 hover:text-red-400 transition-colors tracking-tight mb-1`}
            >
              {b.usuario}
            </Link>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {cleanRoundName(b.jornada)}
            </span>
          </div>
        ))}
        {blanked.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{blanked.length - 5} más
          </p>
        )}
      </div>
    </Card>
  );
}
