import { PageHeader } from '@/components/ui';
import RoundsPageClient from './desktop/RoundsPageClient';

export default function RoundsScreen() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        <PageHeader
          title="Jornadas"
          description="Análisis de alineaciones, puntuaciones y clasificación jornada a jornada."
        />
        <RoundsPageClient />
      </main>
    </div>
  );
}
