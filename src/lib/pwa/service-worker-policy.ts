export type ServiceWorkerStrategy =
  | 'network-only'
  | 'network-with-offline-fallback'
  | 'cache-first';

const PUBLIC_SHELL_ASSETS = new Set([
  '/offline',
  '/brand-logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]);

export function classifyServiceWorkerRequest(input: {
  pathname: string;
  mode?: string;
  headers?: Record<string, string | undefined>;
}): ServiceWorkerStrategy {
  if (
    input.pathname.startsWith('/api/') ||
    input.pathname.startsWith('/_next/') ||
    input.headers?.rsc === '1' ||
    input.headers?.['next-router-prefetch'] === '1'
  ) {
    return 'network-only';
  }

  if (PUBLIC_SHELL_ASSETS.has(input.pathname)) return 'cache-first';
  if (input.mode === 'navigate') return 'network-with-offline-fallback';
  return 'network-only';
}
