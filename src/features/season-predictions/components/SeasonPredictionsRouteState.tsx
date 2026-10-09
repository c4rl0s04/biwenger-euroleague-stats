import type { ReactNode } from 'react';
import { MobileScreen, MobileScreenHeader } from '@/components/mobile/MobileScreen';
import { PageCanvas, PageHeader } from '@/components/ui/foundation';
import styles from './SeasonPredictionsRouteState.module.css';

export function SeasonPredictionsRouteState({
  description,
  children,
}: {
  description: string;
  children: ReactNode;
}) {
  return (
    <>
      <div className={styles.desktop}>
        <PageCanvas>
          <div className="space-y-10">
            <PageHeader title="Predicciones de temporada" description={description} />
            {children}
          </div>
        </PageCanvas>
      </div>
      <div className={styles.phone}>
        <MobileScreen labelledBy="mobile-screen-title">
          <MobileScreenHeader eyebrow="Temporada" title="Predicciones" />
          <div className="space-y-6 py-8">
            <p className="text-sm text-[hsl(var(--content-secondary))]">{description}</p>
            {children}
          </div>
        </MobileScreen>
      </div>
    </>
  );
}
