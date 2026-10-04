import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PersonalBidsScreen } from './PersonalBidsScreen';

it('shows account limits, owner groups, and a pending instruction', () => {
  const html = renderToStaticMarkup(
    <PersonalBidsScreen
      initialData={{
        schedulingAvailable: true,
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
        rules: [
          {
            id: 'rule-1',
            playerId: 21,
            playerName: 'Example Player',
            sellerId: 5,
            listingPrice: 1_000,
            closesAt: '2026-10-04T18:00:00.000Z',
            executeAt: '2026-10-04T17:55:00.000Z',
            amountWithoutBids: 1_100,
            amountWithBids: 1_400,
            status: 'pending',
            resultCode: null,
            submittedAmount: null,
            createdAt: '2026-10-04T09:00:00.000Z',
          },
        ],
      }}
    />
  );
  expect(html).toContain('Saldo disponible');
  expect(html).toContain('Puja máxima');
  expect(html).toContain('Manager A');
  expect(html).toContain('Example Player');
  expect(html).toContain('Programada');
});
