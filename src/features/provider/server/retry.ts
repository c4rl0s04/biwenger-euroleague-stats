import type { ProviderRetryPolicy } from './types';
import { BiwengerNetworkError, BiwengerProviderError } from './errors';

export const READ_RETRY_POLICY: ProviderRetryPolicy = Object.freeze({
  maxRetries: 3,
  initialDelayMs: 5000,
  backoffFactor: 2,
  retryableStatuses: [429, 502, 503, 504],
  retryNetworkErrors: true,
});

export const COMMAND_RETRY_POLICY: ProviderRetryPolicy = Object.freeze({
  maxRetries: 0,
  initialDelayMs: 0,
  backoffFactor: 1,
  retryableStatuses: [],
});

const MAX_RETRY_AFTER_MS = 60_000;

export function parseRetryAfter(header: string | null | undefined): number | undefined {
  const value = header?.trim();
  if (!value) return undefined;
  if (/^\d+$/.test(value)) return Number(value) * 1000;
  if (!/[a-z]/i.test(value)) return undefined;
  const deadline = Date.parse(value);
  return Number.isFinite(deadline) ? Math.max(0, deadline - Date.now()) : undefined;
}

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
        ((policy.retryNetworkErrors && error instanceof BiwengerNetworkError) ||
          (status !== undefined && policy.retryableStatuses.includes(status))) &&
        attempt < policy.maxRetries;

      if (!isRetryable) {
        throw error;
      }

      const retryAfter = error instanceof BiwengerProviderError ? error.retryAfterMs : undefined;
      if (retryAfter !== undefined && retryAfter > MAX_RETRY_AFTER_MS) throw error;
      const delayMs = Math.max(currentDelay, retryAfter ?? 0);
      attempt += 1;
      options?.onRetry?.({
        attempt,
        maxRetries: policy.maxRetries,
        delayMs,
        error,
      });

      await sleep(delayMs);
      currentDelay *= policy.backoffFactor;
    }
  }
}
