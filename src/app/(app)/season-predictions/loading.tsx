import { PageCanvas, PageHeader, Skeleton } from '@/components/ui/foundation';

export default function Loading() {
  return (
    <PageCanvas>
      <div className="space-y-10">
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
    </PageCanvas>
  );
}
