'use client';

import { Button, PageCanvas, PageHeader } from '@/components/ui/foundation';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageCanvas>
      <div className="space-y-6">
        <PageHeader
          title="Predicciones de temporada"
          description="No se pudieron cargar las opciones de esta temporada."
        />
        <Button onClick={reset}>Reintentar</Button>
      </div>
    </PageCanvas>
  );
}
