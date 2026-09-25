import { CONFIG } from '@/lib/config';
import type {
  BiwengerCommandOptions,
  BiwengerQueryOptions,
  BiwengerRequestContext,
  ProviderCommandResult,
  ProviderRetryPolicy,
} from './types';
import {
  BiwengerAuthError,
  BiwengerMutationError,
  BiwengerNetworkError,
  BiwengerProviderError,
  BiwengerRateLimitError,
} from './errors';
import { COMMAND_RETRY_POLICY, executeWithRetry, READ_RETRY_POLICY } from './retry';

export interface ProviderClientConfig {
  baseUrl?: string;
  defaultToken?: string;
  defaultLeagueId?: string;
  defaultUserId?: string;
  versionFallback?: string;
  readRetryPolicy?: ProviderRetryPolicy;
  commandRetryPolicy?: ProviderRetryPolicy;
  defaultDelayRange?: [number, number];
  sleepFn?: (ms: number) => Promise<void>;
  fetchFn?: typeof fetch;
}

const DEFAULT_DELAY_RANGE: [number, number] = [2000, 5000];

export class BiwengerProviderClient {
  private readonly baseUrl: string;
  private readonly defaultToken?: string;
  private readonly defaultLeagueId?: string;
  private readonly defaultUserId?: string;
  private readonly versionFallback?: string;
  private readonly readRetryPolicy: ProviderRetryPolicy;
  private readonly commandRetryPolicy: ProviderRetryPolicy;
  private readonly defaultDelayRange: [number, number];
  private readonly sleepFn: (ms: number) => Promise<void>;
  private readonly fetchFn: typeof fetch;
  private cachedVersion: string | null = null;

  constructor(config: ProviderClientConfig = {}) {
    this.baseUrl = config.baseUrl || CONFIG.API.BASE_URL;
    this.defaultToken = config.defaultToken ?? CONFIG.API.TOKEN;
    this.defaultLeagueId = config.defaultLeagueId ?? CONFIG.API.LEAGUE_ID;
    this.defaultUserId = config.defaultUserId ?? CONFIG.API.USER_ID;
    this.versionFallback = config.versionFallback ?? CONFIG.API.VERSION_FALLBACK;
    this.readRetryPolicy = config.readRetryPolicy ?? READ_RETRY_POLICY;
    this.commandRetryPolicy = config.commandRetryPolicy ?? COMMAND_RETRY_POLICY;
    this.defaultDelayRange = config.defaultDelayRange ?? DEFAULT_DELAY_RANGE;
    this.sleepFn =
      config.sleepFn ??
      ((ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms)));
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
  }

  private getRandomDelay(min: number, max: number): number {
    if (min >= max) return min;
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  /**
   * Discovers and caches the Biwenger API version from /account.
   */
  async ensureApiVersion(): Promise<string | null> {
    if (this.cachedVersion) return this.cachedVersion;

    try {
      const res = await this.executeFetch('/account', {
        method: 'GET',
        skipVersionCheck: true,
        delayMs: 0,
      });

      if (res && typeof res === 'object' && 'version' in res && (res as any).version) {
        this.cachedVersion = String((res as any).version);
        return this.cachedVersion;
      }

      if (this.versionFallback) {
        this.cachedVersion = this.versionFallback;
        console.warn(
          `⚠️ Biwenger version missing; using configured fallback ${this.cachedVersion}`
        );
        return this.cachedVersion;
      }

      throw new BiwengerProviderError('Biwenger account response did not include an API version');
    } catch (e: any) {
      if (this.versionFallback) {
        this.cachedVersion = this.versionFallback;
        console.warn(
          `⚠️ Failed to detect API version, using configured fallback: ${this.cachedVersion}`
        );
        return this.cachedVersion;
      }
      throw new BiwengerProviderError(
        `Failed to detect Biwenger API version and BIWENGER_API_VERSION_FALLBACK is not configured: ${e?.message || e}`
      );
    }
  }

  /**
   * Low-level fetch execution with header formatting, safe delay, and redacted error handling.
   */
  private async executeFetch(
    endpoint: string,
    options: {
      method: string;
      body?: unknown;
      skipVersionCheck?: boolean;
      delayMs?: number;
      headers?: Record<string, string>;
      cache?: RequestCache;
    },
    context?: BiwengerRequestContext
  ): Promise<any> {
    const rawToken =
      context?.token || this.defaultToken || CONFIG.API.TOKEN || process.env.BIWENGER_TOKEN;
    const leagueId =
      context?.leagueId ||
      this.defaultLeagueId ||
      CONFIG.API.LEAGUE_ID ||
      process.env.BIWENGER_LEAGUE_ID;
    const userId =
      context?.userId || this.defaultUserId || CONFIG.API.USER_ID || process.env.BIWENGER_USER_ID;

    if (!rawToken) throw new BiwengerAuthError(401, 'BIWENGER_TOKEN is missing', endpoint);
    if (!leagueId) {
      throw new BiwengerProviderError(
        'BIWENGER_LEAGUE_ID is missing',
        undefined,
        undefined,
        endpoint
      );
    }

    let finalEndpoint = endpoint;
    if (!options.skipVersionCheck && endpoint !== '/account') {
      const v = await this.ensureApiVersion();
      if (v) {
        const separator = finalEndpoint.includes('?') ? '&' : '?';
        finalEndpoint = `${finalEndpoint}${separator}v=${v}`;
      }
    }

    const url = `${this.baseUrl}${finalEndpoint}`;
    const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;

    const headers: Record<string, string> = {
      Authorization: token,
      'X-League': String(leagueId),
      'X-User': String(userId || ''),
      Accept: 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...(options.headers || {}),
    };

    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    const delay =
      options.delayMs !== undefined
        ? options.delayMs
        : process.env.NODE_ENV === 'test' && !process.env.ENABLE_PROVIDER_DELAY
          ? 0
          : this.getRandomDelay(this.defaultDelayRange[0], this.defaultDelayRange[1]);

    if (delay > 0) {
      console.log(`Fetching: ${url} (Wait: ${delay}ms)`);
      await this.sleepFn(delay);
    } else {
      console.log(`Fetching: ${url} (Wait: 0ms)`);
    }

    const fetchOptions: RequestInit = {
      headers,
      method: options.method,
      cache: options.cache,
    };

    if (options.body) {
      fetchOptions.body =
        typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url, fetchOptions);
    } catch (networkError: any) {
      const netErr = new BiwengerNetworkError(
        networkError?.message || 'Network request failed',
        endpoint
      );
      console.error(`Failed to fetch ${endpoint}:`, netErr.message);
      throw netErr;
    }

    // On non-2xx status, NEVER read or leak response body
    if (!response.ok) {
      if (response.status === 429) {
        throw new BiwengerRateLimitError(endpoint);
      }
      if (response.status === 401 || response.status === 403) {
        const authErr = new BiwengerAuthError(
          response.status as 401 | 403,
          response.statusText || 'Unauthorized',
          endpoint
        );
        console.error(`Failed to fetch ${endpoint}:`, authErr.message);
        throw authErr;
      }
      const providerErr = new BiwengerProviderError(
        `Biwenger API Error: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
        endpoint
      );
      console.error(`Failed to fetch ${endpoint}:`, providerErr.message);
      throw providerErr;
    }

    const text = await response.text();
    try {
      return text ? JSON.parse(text) : { success: true, status: response.status };
    } catch {
      return { success: true, status: response.status, raw: text };
    }
  }

  /**
   * Executes an idempotent read query (GET).
   * Follows READ_RETRY_POLICY (up to 3 retries with exponential backoff on 429).
   */
  async query<T = any>(
    endpoint: string,
    options: BiwengerQueryOptions = {},
    context?: BiwengerRequestContext
  ): Promise<T> {
    const effectiveContext = context ?? options.context;
    const policy: ProviderRetryPolicy = {
      ...this.readRetryPolicy,
      maxRetries: options.retries !== undefined ? options.retries : this.readRetryPolicy.maxRetries,
      initialDelayMs:
        options.retryDelay !== undefined ? options.retryDelay : this.readRetryPolicy.initialDelayMs,
    };

    return executeWithRetry(
      async () => {
        return this.executeFetch(
          endpoint,
          {
            method: 'GET',
            skipVersionCheck: options.skipVersionCheck,
            delayMs: options.delayMs,
            headers: options.headers,
            cache: options.cache,
          },
          effectiveContext
        );
      },
      policy,
      {
        sleepFn: this.sleepFn,
        onRetry: ({ delayMs }) => {
          console.warn(`⚠️ Rate Limit (429). Pausing ${delayMs}ms before retrying...`);
        },
      }
    );
  }

  /**
   * Executes a state-mutating command (POST, PUT, DELETE).
   * Follows COMMAND_RETRY_POLICY: fails closed immediately on 429 (0 retries).
   * Sanitizes return data to guarantee zero secret leakage.
   */
  async command(
    endpoint: string,
    options: BiwengerCommandOptions,
    context?: BiwengerRequestContext
  ): Promise<ProviderCommandResult> {
    const method = options.method;
    if (method !== 'POST' && method !== 'PUT' && method !== 'DELETE') {
      throw new BiwengerMutationError(`Unsupported command method: ${method}`, undefined, endpoint);
    }

    const policy: ProviderRetryPolicy = {
      ...this.commandRetryPolicy,
      maxRetries:
        options.retries !== undefined ? options.retries : this.commandRetryPolicy.maxRetries,
      initialDelayMs:
        options.retryDelay !== undefined
          ? options.retryDelay
          : this.commandRetryPolicy.initialDelayMs,
    };

    const effectiveContext = context ?? options.context;
    return executeWithRetry(
      async () => {
        try {
          const rawResult = await this.executeFetch(
            endpoint,
            {
              method,
              body: options.body,
              skipVersionCheck: options.skipVersionCheck,
              delayMs: options.delayMs,
              headers: options.headers,
            },
            effectiveContext
          );

          // Verify whether provider returned a soft error object in a 200 payload
          if (rawResult && typeof rawResult === 'object') {
            const hasError = Boolean((rawResult as any).error);
            const status = (rawResult as any).status;
            const failedStatus = typeof status === 'number' && (status < 200 || status >= 300);

            if (hasError || failedStatus) {
              throw new BiwengerMutationError(
                'Biwenger no pudo completar la operación solicitada.',
                typeof status === 'number' ? status : undefined,
                endpoint
              );
            }
          }

          return {
            status: 'completed' as const,
            httpStatus: 200,
            raw: rawResult,
          };
        } catch (error: any) {
          if (
            error instanceof BiwengerRateLimitError ||
            error instanceof BiwengerAuthError ||
            error instanceof BiwengerMutationError ||
            error instanceof BiwengerNetworkError
          ) {
            throw error;
          }
          if (error instanceof BiwengerProviderError) {
            throw new BiwengerMutationError(error.message, error.status, endpoint);
          }
          throw new BiwengerMutationError(
            'Biwenger no pudo completar la operación solicitada.',
            undefined,
            endpoint
          );
        }
      },
      policy,
      {
        sleepFn: this.sleepFn,
      }
    );
  }
}

export function createBiwengerProviderClient(
  config?: ProviderClientConfig
): BiwengerProviderClient {
  return new BiwengerProviderClient(config);
}

export const biwengerProviderClient = new BiwengerProviderClient();
