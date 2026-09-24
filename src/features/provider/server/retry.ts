import type { ProviderRetryPolicy } from './types';
import { BiwengerRateLimitError } from './errors';

export const READ_RETRY_POLICY: ProviderRetryPolicy = Object.freeze({
  maxRetries: 3,
  initialDelayMs: 5000,
  backoffFactor: 2,
  retryableStatuses: [429],
});

export const COMMAND_RETRY_POLICY: ProviderRetryPolicy = Object.freeze({
  maxRetries: 0,
  initialDelayMs: 0,
  backoffFactor: 1,
  retryableStatuses: [],
});

export interface RetryContext {
  attempt: number;
  maxRetries: number;
  delayMs: number;
  error: unknown;
}

export async function executeWithRetry<T>(
  operation: (attempt: number) => Promise<T>,
  policy: ProviderRetryPolicy,
  options?: {
    sleepFn?: (ms: number) => Promise<void>;
    onRetry?: (context: RetryContext) => void;
  }
): Promise<T> {
  const sleep =
    options?.sleepFn ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let currentDelay = policy.initialDelayMs;
  let attempt = 0;

  while (true) {
    try {
      return await operation(attempt);
    } catch (error) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status?: number }).status
          : undefined;

      const isRetryable =
        (error instanceof BiwengerRateLimitError ||
          (status !== undefined && policy.retryableStatuses.includes(status))) &&
        attempt < policy.maxRetries;

      if (!isRetryable) {
        throw error;
      }

      attempt += 1;
      options?.onRetry?.({
        attempt,
        maxRetries: policy.maxRetries,
        delayMs: currentDelay,
        error,
      });

      await sleep(currentDelay);
      currentDelay *= policy.backoffFactor;
    }
  }
}
