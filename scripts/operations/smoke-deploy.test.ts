import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  DEFAULT_PRODUCTION_URL,
  PROBES,
  resolveTargetUrl,
  runProbe,
  type SmokeProbe,
} from './smoke-deploy';

describe('smoke-deploy runner', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('resolveTargetUrl', () => {
    it('uses custom argument when provided', () => {
      expect(resolveTargetUrl('https://preview.vercel.app/')).toBe('https://preview.vercel.app');
    });

    it('defaults to production URL when no argument is given', () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'smoke-deploy.ts'];
      try {
        expect(resolveTargetUrl()).toBe(DEFAULT_PRODUCTION_URL);
      } finally {
        process.argv = originalArgv;
      }
    });

    it('strips trailing slashes from target URL', () => {
      expect(resolveTargetUrl('http://localhost:3000///')).toBe('http://localhost:3000');
    });
  });

  describe('PROBES definition', () => {
    it('defines 4 critical smoke probes', () => {
      expect(PROBES).toHaveLength(4);
      const paths = PROBES.map((p) => p.path);
      expect(paths).toContain('/api/health');
      expect(paths).toContain('/login');
      expect(paths).toContain('/api/landing-stats');
      expect(paths).toContain('/');
    });
  });

  describe('runProbe', () => {
    it('returns passed: true on successful status match', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          status: 200,
          text: async () => JSON.stringify({ status: 'healthy', database: { status: 'connected' } }),
        } as unknown as Response)
      );

      const probe: SmokeProbe = {
        name: 'Health Check',
        path: '/api/health',
        expectedStatus: 200,
      };

      const result = await runProbe('https://test.app', probe);

      expect(result.passed).toBe(true);
      expect(result.status).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('fails when response status does not match expected single status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          status: 500,
          text: async () => 'Internal Error',
        } as unknown as Response)
      );

      const probe: SmokeProbe = {
        name: 'Landing Stats',
        path: '/api/landing-stats',
        expectedStatus: 200,
      };

      const result = await runProbe('https://test.app', probe);

      expect(result.passed).toBe(false);
      expect(result.status).toBe(500);
      expect(result.error).toBe('Expected status 200, got 500');
    });

    it('matches when response status matches one of the array options', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          status: 307,
          text: async () => 'Redirecting',
        } as unknown as Response)
      );

      const probe: SmokeProbe = {
        name: 'Landing Route',
        path: '/',
        expectedStatus: [200, 307, 308],
      };

      const result = await runProbe('https://test.app', probe);

      expect(result.passed).toBe(true);
      expect(result.status).toBe(307);
    });

    it('fails when validator callback returns an error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValueOnce({
          status: 200,
          text: async () => JSON.stringify({ status: 'unhealthy', database: { status: 'disconnected' } }),
        } as unknown as Response)
      );

      const probe: SmokeProbe = PROBES[0]; // /api/health probe
      const result = await runProbe('https://test.app', probe);

      expect(result.passed).toBe(false);
      expect(result.error).toBe("Expected status 'healthy', got 'unhealthy'");
    });

    it('captures network errors cleanly without throwing', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockRejectedValueOnce(new Error('ECONNREFUSED'))
      );

      const probe: SmokeProbe = {
        name: 'Failing probe',
        path: '/unreachable',
        expectedStatus: 200,
      };

      const result = await runProbe('https://test.app', probe);

      expect(result.passed).toBe(false);
      expect(result.status).toBe(0);
      expect(result.error).toBe('ECONNREFUSED');
    });
  });
});
