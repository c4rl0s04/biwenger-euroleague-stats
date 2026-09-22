import Link from 'next/link';

import { MobileScreenHeader } from '@/components/mobile/MobileScreen';
import { getHomeSummary } from '../server/services/summary.service';

import HomePreseasonState from '../components/HomePreseasonState';
import HomePulseCard from '../components/HomePulseCard';
import HomeActivityFilterBar from '../components/HomeActivityFilterBar';

export default async function HomeSummarySection({ userId }: { userId: string }) {
  const summary = await getHomeSummary(userId).catch((error) => {
    console.error('Mobile home summary error:', error);
    return null;
  });

  if (!summary) {
    return (
      <>
        <MobileScreenHeader eyebrow="BiwengerStats" title="Inicio" />
        <HomeActivityFilterBar />
        <section className="mobile-home-inline-error" role="alert">
          <strong>No hemos podido cargar tu pulso</strong>
          <span>La actividad de la liga sigue disponible más abajo.</span>
          <Link href="/">Reintentar</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <MobileScreenHeader eyebrow={summary.seasonName} title="Inicio" />
      <HomeActivityFilterBar />
      <HomePulseCard summary={summary} />
      {summary.phase === 'preseason' && <HomePreseasonState seasonName={summary.seasonName} />}
    </>
  );
}
