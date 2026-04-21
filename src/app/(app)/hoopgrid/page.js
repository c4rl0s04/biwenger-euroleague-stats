import HoopgridClient from '@/components/hoopgrid/HoopgridClient';
import { PageHeader } from '@/components/ui';
import { Suspense } from 'react';

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
          description="Completa la cuadrícula de 3x3 seleccionando jugadores que cumplan ambos criterios."
        />

        {/* Section Title & Game Container */}
        <div className="container mx-auto px-4 pb-20">
          <div className="flex flex-col items-center justify-center">
            <Suspense
              fallback={
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              }
            >
              <HoopgridClient />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
