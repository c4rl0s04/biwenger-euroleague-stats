import { Suspense } from 'react';
import HoopgridClient from '../components/HoopgridClient';
import { PageHeader } from '@/components/ui';

export function DesktopHoopgridScreen() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full relative z-10">
        <PageHeader
          title="Hoopgrid Diario"
          description="Completa la cuadrícula de 3x3 seleccionando jugadores que cumplan ambos criterios."
        />

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

export default DesktopHoopgridScreen;
