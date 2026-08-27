export interface MobileScreenState<T> {
  data: T | null;
  status: 'loading' | 'ready' | 'empty' | 'error';
  errorMessage?: string;
}

const DEFAULT_ERROR_MESSAGE = 'No hemos podido cargar esta pantalla. Inténtalo de nuevo.';

function isEmpty(data: unknown): boolean {
  return data == null || data === '' || (Array.isArray(data) && data.length === 0);
}

export function createMobileScreenState<T>(
  data: T | null,
  error?: unknown
): MobileScreenState<T> {
  if (error) {
    return { data: null, status: 'error', errorMessage: DEFAULT_ERROR_MESSAGE };
  }

  if (isEmpty(data)) return { data, status: 'empty' };
  return { data, status: 'ready' };
}
