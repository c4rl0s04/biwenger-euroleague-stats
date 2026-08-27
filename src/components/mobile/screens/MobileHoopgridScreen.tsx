import { Suspense } from 'react';

import HoopgridClient from '@/components/hoopgrid/HoopgridClient';

import { MobileScreen, MobileScreenHeader } from '../MobileScreen';

export default function MobileHoopgridScreen() {
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-hoopgrid-screen">
      <MobileScreenHeader
        eyebrow="Desafío diario"
        title="Hoopgrid"
        description="Nueve cruces. Un jugador válido en cada celda."
      />
      <Suspense fallback={<div className="mobile-hoopgrid-loading" aria-label="Cargando Hoopgrid" />}>
        <HoopgridClient mobile />
      </Suspense>
    </MobileScreen>
  );
}
