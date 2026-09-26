import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
vi.mock('@/components/mobile/MobileHeaderActions', () => ({ default: () => null }));
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import MarketSectionScreen from './MarketSectionScreen';

it.each([
  ['transfers', 'Todas las compras y ventas de la liga en una cronología legible.'],
  ['investments', 'Operaciones que generaron valor y decisiones que lo destruyeron.'],
  ['bids', 'Competencia real por los jugadores: pujas, rivales y sobreprecios.'],
  ['trends', 'Cómo evolucionan el volumen y el precio de las operaciones.'],
  ['unknown', undefined],
])('preserves the original section scaffold output for %s', (section, description) => {
  const content = <p>synthetic content</p>;
  const expected = renderToStaticMarkup(
    <MobileDetailScaffold
      title="Test"
      context="Mercado"
      backHref="/market"
      description={description}
    >
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      {content}
    </MobileDetailScaffold>
  );
  expect(
    renderToStaticMarkup(
      <MarketSectionScreen title="Test" section={section!}>
        {content}
      </MarketSectionScreen>
    )
  ).toBe(expected);
});
