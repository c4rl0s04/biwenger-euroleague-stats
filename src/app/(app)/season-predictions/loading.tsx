import { PageHeader, Skeleton } from '@/components/ui/foundation';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pt-16">
      <PageHeader
        title="Predicciones de temporada"
        description="Cargando opciones de la temporada…"
      />
      <div className="grid gap-8 lg:grid-cols-2">
        {[0, 1].map((index) => (
          <Skeleton key={index} className="h-56 w-full" />
        ))}
      </div>
    </div>
  );
}
