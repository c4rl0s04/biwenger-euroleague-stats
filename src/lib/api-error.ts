export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: { invalidPlayerIds?: string[]; affectedSlotIndexes?: number[] },
    readonly reference?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export async function responseError(response: Response): Promise<ApiError> {
  const fallback = `No se pudo completar la solicitud (${response.status}).`;
  try {
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object') return new ApiError(fallback, response.status);
    const data = body as {
      error?: unknown;
      message?: unknown;
      code?: unknown;
      details?: unknown;
      reference?: unknown;
    };
    const message =
      typeof data.error === 'string'
        ? data.error
        : typeof data.message === 'string'
          ? data.message
          : fallback;
    const raw =
      data.details && typeof data.details === 'object'
        ? (data.details as { invalidPlayerIds?: unknown; affectedSlotIndexes?: unknown })
        : {};
    return new ApiError(
      message,
      response.status,
      typeof data.code === 'string' ? data.code : undefined,
      {
        invalidPlayerIds: Array.isArray(raw.invalidPlayerIds)
          ? raw.invalidPlayerIds.filter((id): id is string => typeof id === 'string')
          : undefined,
        affectedSlotIndexes: Array.isArray(raw.affectedSlotIndexes)
          ? raw.affectedSlotIndexes.filter(
              (i): i is number => Number.isInteger(i) && i >= 0 && i < 10
            )
          : undefined,
      },
      typeof data.reference === 'string' && /^[a-f0-9-]{36}$/.test(data.reference)
        ? data.reference
        : undefined
    );
  } catch {
    return new ApiError(fallback, response.status);
  }
}
