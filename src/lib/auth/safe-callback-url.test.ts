import { describe, expect, it } from 'vitest';
import { sanitizeCallbackUrl } from './safe-callback-url';

describe('login callback contract', () => {
  it('keeps internal routes, query strings and fragments', () => {
    expect(sanitizeCallbackUrl('/season-review?tab=limits#comparison')).toBe(
      '/season-review?tab=limits#comparison'
    );
  });

  it('rejects absolute, protocol-relative and malformed destinations', () => {
    expect(sanitizeCallbackUrl('https://example.com/steal-session')).toBe('/dashboard');
    expect(sanitizeCallbackUrl('//example.com/steal-session')).toBe('/dashboard');
    expect(sanitizeCallbackUrl('javascript:alert(1)')).toBe('/dashboard');
    expect(sanitizeCallbackUrl(null)).toBe('/dashboard');
  });
});
