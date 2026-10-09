'use client';

import { Button } from '@/components/ui/foundation';
import { SeasonPredictionsRouteState } from '@/features/season-predictions/public';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <SeasonPredictionsRouteState description="No se pudieron cargar las opciones de esta temporada.">
      <Button onClick={reset}>Reintentar</Button>
    </SeasonPredictionsRouteState>
  );
}
