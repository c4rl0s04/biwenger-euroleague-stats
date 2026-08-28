import Link from 'next/link';

import { MobileScreenHeader } from '../MobileScreen';
import { getHomeSummary } from '@/lib/services/app/homeService';

import HomePreseasonState from './HomePreseasonState';
import HomePulseCard from './HomePulseCard';
import HomeQuickActions from './HomeQuickActions';

export default async function HomeSummarySection({ userId }: { userId: string }) {
  const summary = await getHomeSummary(userId).catch((error) => {
    console.error('Mobile home summary error:', error);
    return null;
  });

  if (!summary) {
    return (
      <>
        <MobileScreenHeader eyebrow="BiwengerStats" title="Inicio" />
        <section className="mobile-home-inline-error" role="alert">
          <strong>No hemos podido cargar tu pulso</strong>
          <span>La actividad de la liga sigue disponible más abajo.</span>
          <Link href="/">Reintentar</Link>
        </section>
        <HomeQuickActions roundId={null} />
      </>
    );
  }

  return (
    <>
      <MobileScreenHeader eyebrow={summary.seasonName} title="Inicio" />
      <HomePulseCard summary={summary} />
      <HomeQuickActions roundId={summary.round.id} />
      {summary.phase === 'preseason' && <HomePreseasonState seasonName={summary.seasonName} />}
    </>
  );
}
