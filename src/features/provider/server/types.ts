export interface BiwengerRequestContext {
  token?: string;
  leagueId?: string;
  userId?: string;
}

export interface ProviderRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffFactor: number;
  retryableStatuses: number[];
}

export interface BiwengerQueryOptions {
  skipVersionCheck?: boolean;
  retries?: number;
  retryDelay?: number;
  cache?: RequestCache;
  delayMs?: number;
  headers?: Record<string, string>;
  context?: BiwengerRequestContext;
}

export interface BiwengerCommandOptions {
  method: 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  skipVersionCheck?: boolean;
  delayMs?: number;
  headers?: Record<string, string>;
  retries?: number;
  retryDelay?: number;
  context?: BiwengerRequestContext;
}

export interface ProviderCommandResult {
  status: 'completed';
  httpStatus: number;
  raw?: unknown;
}
