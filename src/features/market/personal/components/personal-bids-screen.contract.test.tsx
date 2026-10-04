import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonalBidsScreen } from './PersonalBidsScreen';

it('shows live account limits and owner groups without scheduled controls', () => {
  const html = renderToStaticMarkup(
    <PersonalBidsScreen
      initialData={{
        market: {
          balance: 900,
          maximumBid: 1_500,
          observedAt: '2026-10-04T09:00:00.000Z',
          listings: [
            {
              playerId: 21,
              playerName: 'Example Player',
              sellerId: 5,
              sellerName: 'Manager A',
              price: 1_000,
              closesAt: '2026-10-04T18:00:00.000Z',
              isOwnListing: false,
              ownWaitingOffers: [],
            },
          ],
        },
      }}
    />
  );
  expect(html).toContain('Saldo disponible');
  expect(html).toContain('Puja máxima');
  expect(html).toContain('Manager A');
  expect(html).toContain('Example Player');
  expect(html).not.toContain('Programar según otras pujas');
});
