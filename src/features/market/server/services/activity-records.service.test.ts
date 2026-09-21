import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { createMarketRecordsService } from './activity-records.service';

it('allowlists public facts and retains the supplied season, numeric strings, nulls and errors', async () => {
  const deps = {
    transfer: vi
      .fn()
      .mockResolvedValue({ precio: '1000', player_name: null, comprador: null, token: 'excluded' }),
    gain: vi.fn().mockResolvedValue({ name: 'Player', price_increment: '10', owner_id: '7' }),
  };
  const service = createMarketRecordsService(deps);
  expect(await service.getHighestTransferRecord('season-A')).toEqual({
    precio: '1000',
    player_name: null,
    comprador: null,
  });
  expect(await service.getBiggestGainRecord('season-A')).toEqual({
    name: 'Player',
    price_increment: '10',
  });
  expect(deps.transfer).toHaveBeenCalledWith('season-A');
  expect(deps.gain).toHaveBeenCalledWith('season-A');
  deps.transfer.mockResolvedValue(null);
  expect(await service.getHighestTransferRecord('season-B')).toBeNull();
  expect(deps.transfer).toHaveBeenCalledTimes(2);
  deps.gain.mockRejectedValueOnce(new Error('query failure'));
  await expect(service.getBiggestGainRecord('season-A')).rejects.toThrow('query failure');
});
