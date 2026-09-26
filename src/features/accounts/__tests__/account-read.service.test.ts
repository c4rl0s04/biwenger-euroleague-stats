import { describe, expect, it, vi } from 'vitest';
import { AccountReadService } from '../server/services/account-read.service';
import type { AccountRepository } from '../server/repositories/account.repository';

describe('AccountReadService', () => {
  it('returns settings view model for user', async () => {
    const mockRepo = {
      getUserById: vi.fn().mockResolvedValue({
        id: 'user-123',
        name: 'Carlos',
        email: 'carlos@example.com',
      }),
    };

    const service = new AccountReadService(mockRepo as unknown as AccountRepository);
    const result = await service.getAccountSettings('user-123', true);

    expect(result).toEqual({
      id: 'user-123',
      name: 'Carlos',
      email: 'carlos@example.com',
      biwengerLinked: true,
    });
  });

  it('handles user not found gracefully', async () => {
    const mockRepo = {
      getUserById: vi.fn().mockResolvedValue(null),
    };

    const service = new AccountReadService(mockRepo as unknown as AccountRepository);
    const result = await service.getAccountSettings('missing-user', false);

    expect(result).toEqual({
      id: 'missing-user',
      name: null,
      email: null,
      biwengerLinked: false,
    });
  });
});
