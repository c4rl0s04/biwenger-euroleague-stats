import { describe, expect, it, vi } from 'vitest';
import { resolveIngestionContext } from '../ingestion';
import { BiwengerProviderClient } from '../client';
const account = (leagues: unknown[]) => ({ data: { leagues } });

describe('ingestion identity discovery', () => {
  it('bootstraps without a league header and uses the selected league membership', async () => {
    const client = new BiwengerProviderClient();
    const query = vi.spyOn(client, 'query').mockResolvedValue(
      account([
        { id: 9, user: { id: 7 } },
        { id: 8, user: { id: 6 } },
      ])
    );
    await expect(resolveIngestionContext('9', client, 'fixture-ingestion')).resolves.toEqual({
      token: 'fixture-ingestion',
      leagueId: '9',
      userId: '7',
    });
    expect(query).toHaveBeenCalledWith(
      '/account',
      expect.objectContaining({ skipVersionCheck: true, cache: 'no-store' }),
      { token: 'fixture-ingestion' }
    );
  });
  it.each([
    account([]),
    account([{ id: 8, user: { id: 7 } }]),
    account([
      { id: 9, user: { id: 7 } },
      { id: 9, user: { id: 8 } },
    ]),
    account([{ id: 9 }]),
    {},
  ])('rejects missing, ambiguous or malformed membership before writes', async (response) => {
    const client = new BiwengerProviderClient();
    vi.spyOn(client, 'query').mockResolvedValue(response);
    await expect(resolveIngestionContext('9', client, 'fixture-ingestion')).rejects.toThrow();
  });
  it('requires the ingestion credential rather than borrowing a personal one', async () => {
    await expect(resolveIngestionContext('9', new BiwengerProviderClient(), '')).rejects.toThrow(
      'BIWENGER_TOKEN'
    );
  });
});
