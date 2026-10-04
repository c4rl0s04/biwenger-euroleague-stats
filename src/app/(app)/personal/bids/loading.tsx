import { PageCanvas, PageHeader } from '@/components/ui/foundation';

export default function LoadingPersonalBids() {
  return (
    <PageCanvas>
      <PageHeader title="Pujas privadas" description="Cargando el mercado en directo…" />
      <div className="mt-8 h-64 animate-pulse rounded-2xl bg-[hsl(var(--surface-card))]" />
    </PageCanvas>
  );
}
