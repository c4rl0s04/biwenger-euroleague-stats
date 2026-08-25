import { describe, expect, it } from 'vitest';
import { classifyServiceWorkerRequest } from './service-worker-policy';

describe('service worker privacy policy', () => {
  it('never caches APIs, authentication or React Server Component requests', () => {
    expect(classifyServiceWorkerRequest({ pathname: '/api/standings/full' })).toBe('network-only');
    expect(classifyServiceWorkerRequest({ pathname: '/api/auth/session' })).toBe('network-only');
    expect(classifyServiceWorkerRequest({ pathname: '/dashboard', headers: { rsc: '1' } })).toBe(
      'network-only'
    );
  });

  it('uses an offline fallback for documents without persisting their responses', () => {
    expect(classifyServiceWorkerRequest({ pathname: '/dashboard', mode: 'navigate' })).toBe(
      'network-with-offline-fallback'
    );
  });

  it('only cache-first serves the explicit public shell assets', () => {
    expect(classifyServiceWorkerRequest({ pathname: '/icons/icon-192.png' })).toBe('cache-first');
    expect(classifyServiceWorkerRequest({ pathname: '/offline' })).toBe('cache-first');
    expect(classifyServiceWorkerRequest({ pathname: '/player/42' })).toBe('network-only');
  });
});
