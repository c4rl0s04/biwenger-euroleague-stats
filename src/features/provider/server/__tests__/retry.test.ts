import { describe, expect, it, vi } from 'vitest';
import {
  COMMAND_RETRY_POLICY,
  executeWithRetry,
  READ_RETRY_POLICY,
  type RetryContext,
} from '../retry';
import { BiwengerRateLimitError, BiwengerProviderError } from '../errors';

describe('Provider retry policies and runner', () => {
  it('READ_RETRY_POLICY allows 3 retries on 429', () => {
    expect(READ_RETRY_POLICY.maxRetries).toBe(3);
    expect(READ_RETRY_POLICY.retryableStatuses).toContain(429);
  });

  it('COMMAND_RETRY_POLICY fails closed with 0 retries', () => {
    expect(COMMAND_RETRY_POLICY.maxRetries).toBe(0);
    expect(COMMAND_RETRY_POLICY.retryableStatuses).toHaveLength(0);
  });

  it('retries when error matches retryable status and succeeds eventually', async () => {
    let callCount = 0;
    const retryEvents: RetryContext[] = [];
    const sleepMock = vi.fn(async () => undefined);

    const operation = vi.fn(async () => {
      callCount += 1;
      if (callCount < 3) {
        throw new BiwengerRateLimitError('/test');
      }
      return { success: true };
    });

    const result = await executeWithRetry(
      operation,
      {
        maxRetries: 3,
        initialDelayMs: 100,
        backoffFactor: 2,
        retryableStatuses: [429],
      },
      {
        sleepFn: sleepMock,
        onRetry: (ctx) => retryEvents.push(ctx),
      }
    );

    expect(result).toEqual({ success: true });
    expect(callCount).toBe(3);
    expect(sleepMock).toHaveBeenCalledTimes(2);
    expect(retryEvents).toHaveLength(2);
    expect(retryEvents[0].delayMs).toBe(100);
    expect(retryEvents[1].delayMs).toBe(200);
  });

  it('stops retrying and throws when maxRetries is exceeded', async () => {
    const sleepMock = vi.fn(async () => undefined);
    const operation = vi.fn(async () => {
      throw new BiwengerRateLimitError('/test');
    });

    await expect(
      executeWithRetry(
        operation,
        {
          maxRetries: 2,
          initialDelayMs: 50,
          backoffFactor: 2,
          retryableStatuses: [429],
        },
        { sleepFn: sleepMock }
      )
    ).rejects.toThrow(BiwengerRateLimitError);

    expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(sleepMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry non-retryable errors', async () => {
    const sleepMock = vi.fn(async () => undefined);
    const operation = vi.fn(async () => {
      throw new BiwengerProviderError('Server error', 500);
    });

    await expect(
      executeWithRetry(
        operation,
        {
          maxRetries: 3,
          initialDelayMs: 100,
          backoffFactor: 2,
          retryableStatuses: [429],
        },
        { sleepFn: sleepMock }
      )
    ).rejects.toThrow(BiwengerProviderError);

    expect(operation).toHaveBeenCalledTimes(1);
    expect(sleepMock).not.toHaveBeenCalled();
  });
});
