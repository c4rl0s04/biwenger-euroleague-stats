/**
 * Client-safe exports for provider domain.
 * NOTE: Server-only provider execution and HTTP operations must NEVER be exported here.
 */

export interface ProviderCommandResult {
  status: 'completed';
  httpStatus: number;
}

export interface ProviderErrorDetail {
  code: string;
  message: string;
  status?: number;
}
