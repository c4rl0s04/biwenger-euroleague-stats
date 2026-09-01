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
  const providerCanary = {
    status: 200,
    token: 'market-provider-canary-token',
    privateProviderPayload: { authorization: 'Bearer market-provider-canary-token' },
  };

  function expectSafeMutationResponse(response: Response, body: unknown) {
    const serialized = JSON.stringify(body);

    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(serialized).not.toContain('market-provider-canary-token');
    expect(serialized).not.toContain('privateProviderPayload');
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { id: '42' } } as any);
  });

  it('covers offer accept and reject contracts', async () => {
    vi.mocked(marketActionsService.acceptOffer).mockResolvedValue(providerCanary as any);
    vi.mocked(marketActionsService.rejectOffer).mockResolvedValue(providerCanary as any);

    const accept = await import('@/app/api/market/offers/accept/route');
    const reject = await import('@/app/api/market/offers/reject/route');

    const acceptResponse = await accept.POST(
      jsonRequest('http://localhost/api/market/offers/accept', { offerId: 10, playerId: 1 })
    );
    const acceptBody = await acceptResponse.json();
    expect(acceptResponse.status).toBe(200);
    expect(acceptBody.success).toBe(true);
    expectSafeMutationResponse(acceptResponse, acceptBody);

    const rejectResponse = await reject.POST(
      jsonRequest('http://localhost/api/market/offers/reject', { offerId: 10 })
    );
    const rejectBody = await rejectResponse.json();
    expect(rejectResponse.status).toBe(200);
    expect(rejectBody.success).toBe(true);
    expectSafeMutationResponse(rejectResponse, rejectBody);

    expect(
      (await accept.POST(jsonRequest('http://localhost/api/market/offers/accept', {}))).status
    ).toBe(400);
  });

  it('covers remove, sell, and sell-all contracts', async () => {
    vi.mocked(marketActionsService.withdrawFromMarket).mockResolvedValue(providerCanary as any);
    vi.mocked(marketActionsService.placeOnMarket).mockResolvedValue(providerCanary as any);
    vi.mocked(marketActionsService.placeAllOnMarket).mockResolvedValue(providerCanary as any);

    const remove = await import('@/app/api/market/remove/route');
    const sell = await import('@/app/api/market/sell/route');
    const sellAll = await import('@/app/api/market/sell-all/route');

    const removeResponse = await remove.DELETE(
      new NextRequest('http://localhost/api/market/remove?playerId=1')
    );
    const removeBody = await removeResponse.json();
    expect(removeResponse.status).toBe(200);
    expect(removeBody.success).toBe(true);
    expectSafeMutationResponse(removeResponse, removeBody);

    const sellResponse = await sell.POST(
      jsonRequest('http://localhost/api/market/sell', { playerId: 1, price: 1000 })
    );
    const sellBody = await sellResponse.json();
    expect(sellResponse.status).toBe(200);
    expect(sellBody.data.message).toBe('Jugador procesado en el mercado correctamente');
    expectSafeMutationResponse(sellResponse, sellBody);

    const sellAllResponse = await sellAll.POST(
      jsonRequest('http://localhost/api/market/sell-all', { pricePercentage: 95 })
    );
    const sellAllBody = await sellAllResponse.json();
    expect(sellAllResponse.status).toBe(200);
    expect(sellAllBody.data.message).toBe('Plantilla entera puesta en mercado');
    expectSafeMutationResponse(sellAllResponse, sellAllBody);
  });

  it('keeps unauthenticated market mutation status codes stable', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);

    const sell = await import('@/app/api/market/sell/route');
    const response = await sell.POST(
      jsonRequest('http://localhost/api/market/sell', { playerId: 1, price: 1000 })
    );

    expect(response.status).toBe(401);
    expect((await response.json()).success).toBe(false);
    expect(response.headers.get('cache-control')).toContain('private');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
