import type { ReactNode } from 'react';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';

const descriptions: Record<string, string> = {
  transfers: 'Todas las compras y ventas de la liga en una cronología legible.',
  investments: 'Operaciones que generaron valor y decisiones que lo destruyeron.',
  bids: 'Competencia real por los jugadores: pujas, rivales y sobreprecios.',
  trends: 'Cómo evolucionan el volumen y el precio de las operaciones.',
};

/** Content slot keeps the explicitly pending bids adapter out of typed row projections. */
export default function MarketSectionScreen({
  title,
  section,
  children,
}: {
  title: string;
  section: string;
  children: ReactNode;
}) {
  return (
    <MobileDetailScaffold
      title={title}
      context="Mercado"
      backHref="/market"
      description={descriptions[section]}
    >
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      {children}
    </MobileDetailScaffold>
  );
}
