'use client';

import { Button, PageCanvas, PageHeader } from '@/components/ui/foundation';

export default function PersonalBidsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <PageCanvas>
      <PageHeader title="Pujas privadas" description="No se pudo cargar el mercado en directo." />
      <Button className="mt-8" onClick={reset}>
        Reintentar
      </Button>
    </PageCanvas>
  );
}
