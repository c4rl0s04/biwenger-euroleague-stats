'use client';

import { Button, PageHeader } from '@/components/ui/foundation';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
      <PageHeader
        title="Predicciones de temporada"
        description="No se pudieron cargar las opciones de esta temporada."
      />
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
