import HoopgridClient from '@/components/hoopgrid/HoopgridClient';
import { PageHeader } from '@/components/ui';

/**
 * Hoopgrid Page
 *
 * A 3x3 trivia game based on Euroleague and Biwenger statistics.
 */

export const metadata = {
  title: 'Hoopgrid | Euroleague Biwenger Stats',
  description: 'Pon a prueba tus conocimientos de la Euroliga con el desafío diario de Hoopgrid.',
};

export default function HoopgridPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        {/* Header Section */}
        <PageHeader
          title="Hoopgrid Diario"
          description="Completa la cuadrícula de 3x3 seleccionando jugadores que cumplan ambos criterios. ¡Menos del 10% de fallos es de crack!"
        />

        {/* Section Title & Game Container */}
        <div className="container mx-auto px-4 pb-20">
          <div className="flex flex-col items-center justify-center">
            <HoopgridClient />
          </div>
        </div>
      </main>
    </div>
  );
}
