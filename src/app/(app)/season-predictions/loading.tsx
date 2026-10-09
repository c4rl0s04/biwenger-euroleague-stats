import { Skeleton } from '@/components/ui/foundation';
import { SeasonPredictionsRouteState } from '@/features/season-predictions/public';

export default function Loading() {
  return (
    <SeasonPredictionsRouteState description="Cargando opciones de la temporada…">
      <div className="grid gap-8 lg:grid-cols-2">
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-56 w-full" />
        ))}
      </div>
    </SeasonPredictionsRouteState>
  );
}
