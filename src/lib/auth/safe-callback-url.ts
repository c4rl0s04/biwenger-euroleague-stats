const DEFAULT_CALLBACK_URL = '/dashboard';

export function sanitizeCallbackUrl(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return DEFAULT_CALLBACK_URL;

  try {
    const parsed = new URL(value, 'https://biwengerstats.local');
    if (parsed.origin !== 'https://biwengerstats.local') return DEFAULT_CALLBACK_URL;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return DEFAULT_CALLBACK_URL;
  }
}
