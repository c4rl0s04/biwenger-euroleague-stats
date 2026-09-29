import { Suspense } from 'react';
import HoopgridClient from '../components/HoopgridClient';
import { MobileScreen, MobileScreenHeader } from '@/components/mobile/MobileScreen';

export function MobileHoopgridScreen() {
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-hoopgrid-screen">
      <MobileScreenHeader eyebrow="Desafío diario" title="Hoopgrid" />
      <Suspense
        fallback={<div className="mobile-hoopgrid-loading" aria-label="Cargando Hoopgrid" />}
      >
        <HoopgridClient mobile />
      </Suspense>
    </MobileScreen>
  );
}

export default MobileHoopgridScreen;
