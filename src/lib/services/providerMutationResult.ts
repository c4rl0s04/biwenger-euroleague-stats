export interface ProviderMutationResponse {
  status?: number;
  error?: unknown;
}

export function assertProviderMutationSucceeded(result: unknown): void {
  if (!result || typeof result !== 'object') return;

  const response = result as ProviderMutationResponse;
  const failedStatus =
    typeof response.status === 'number' && (response.status < 200 || response.status >= 300);

  if (failedStatus || response.error) {
    throw new Error('Biwenger no pudo completar la operación solicitada.');
  }
}
