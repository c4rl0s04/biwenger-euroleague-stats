import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

vi.mock('@/lib/services/marketActionsService', () => ({
  marketActionsService: {
    acceptOffer: vi.fn(),
    rejectOffer: vi.fn(),
    withdrawFromMarket: vi.fn(),
    placeOnMarket: vi.fn(),
    placeAllOnMarket: vi.fn(),
  },
}));

import { marketActionsService } from '@/lib/services/marketActionsService';

function jsonRequest(path: string, body: unknown): NextRequest {
  return new NextRequest(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });
}

describe('market mutation route contracts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as any);
  });

  it('covers offer accept and reject contracts', async () => {
    vi.mocked(marketActionsService.acceptOffer).mockResolvedValue({ accepted: true } as any);
    vi.mocked(marketActionsService.rejectOffer).mockResolvedValue({ rejected: true } as any);

    const accept = await import('@/app/api/market/offers/accept/route');
    const reject = await import('@/app/api/market/offers/reject/route');

    const acceptResponse = await accept.POST(
      jsonRequest('http://localhost/api/market/offers/accept', { offerId: 10, playerId: 1 })
    );
    expect(acceptResponse.status).toBe(200);
    expect((await acceptResponse.json()).success).toBe(true);

    const rejectResponse = await reject.POST(
      jsonRequest('http://localhost/api/market/offers/reject', { offerId: 10 })
    );
    expect(rejectResponse.status).toBe(200);
    expect((await rejectResponse.json()).success).toBe(true);

    expect(
      (await accept.POST(jsonRequest('http://localhost/api/market/offers/accept', {}))).status
    ).toBe(400);
  });

  it('covers remove, sell, and sell-all contracts', async () => {
    vi.mocked(marketActionsService.withdrawFromMarket).mockResolvedValue({ removed: true } as any);
    vi.mocked(marketActionsService.placeOnMarket).mockResolvedValue({ listed: true } as any);
    vi.mocked(marketActionsService.placeAllOnMarket).mockResolvedValue({ listed: 5 } as any);

    const remove = await import('@/app/api/market/remove/route');
    const sell = await import('@/app/api/market/sell/route');
    const sellAll = await import('@/app/api/market/sell-all/route');

    const removeResponse = await remove.DELETE(
      new NextRequest('http://localhost/api/market/remove?playerId=1')
    );
    expect(removeResponse.status).toBe(200);
    expect((await removeResponse.json()).success).toBe(true);

    const sellResponse = await sell.POST(
      jsonRequest('http://localhost/api/market/sell', { playerId: 1, price: 1000 })
    );
    expect(sellResponse.status).toBe(200);
    expect((await sellResponse.json()).data.message).toBe(
      'Jugador procesado en el mercado correctamente'
    );

    const sellAllResponse = await sellAll.POST(
      jsonRequest('http://localhost/api/market/sell-all', { pricePercentage: 95 })
    );
    expect(sellAllResponse.status).toBe(200);
    expect((await sellAllResponse.json()).data.message).toBe('Plantilla entera puesta en mercado');
  });

  it('keeps unauthenticated market mutation status codes stable', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const sell = await import('@/app/api/market/sell/route');
    const response = await sell.POST(
      jsonRequest('http://localhost/api/market/sell', { playerId: 1, price: 1000 })
    );

    expect(response.status).toBe(401);
    expect((await response.json()).success).toBe(false);
  });
});
