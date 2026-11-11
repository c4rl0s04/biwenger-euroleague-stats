import { PageCanvas, PageHeader } from '@/components/ui/foundation';
import RoundsPageClient from './desktop/RoundsPageClient';

export default function RoundsScreen() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        <PageCanvas className="pb-0!">
          <PageHeader
            title="Jornadas"
            description="Análisis de alineaciones, puntuaciones y clasificación jornada a jornada."
          />
        </PageCanvas>
        <RoundsPageClient />
      </main>
    </div>
  );
}
