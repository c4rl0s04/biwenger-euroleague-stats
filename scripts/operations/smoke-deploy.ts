#!/usr/bin/env node
/**
 * Post-Deployment Smoke Check Runner
 *
 * Validates critical HTTP contracts, database connectivity, and SSR rendering
 * against a deployed environment or local preview.
 *
 * Usage:
 *   npx tsx scripts/operations/smoke-deploy.ts [targetUrl]
 *   npm run smoke:deploy [targetUrl]
 */

import { fileURLToPath } from 'node:url';

export interface SmokeProbe {
  name: string;
  path: string;
  expectedStatus: number | number[];
  validate?: (res: Response, body: string) => Promise<string | null> | (string | null);
}

export interface ProbeResult {
  name: string;
  path: string;
  status: number;
  expectedStatus: number | number[];
  latencyMs: number;
  passed: boolean;
  error?: string;
}

export const DEFAULT_PRODUCTION_URL = 'https://advanced-euroleague-biwenger-stats.vercel.app';

export function resolveTargetUrl(customArg?: string): string {
  const argUrl = customArg || process.argv[2];
  const envUrl = process.env.DEPLOYMENT_URL || process.env.NEXT_PUBLIC_APP_URL;
  const rawUrl = argUrl || envUrl || DEFAULT_PRODUCTION_URL;

  // Clean trailing slash
  return rawUrl.replace(/\/+$/, '');
}

export const PROBES: SmokeProbe[] = [
  {
    name: 'Application & Database Health',
    path: '/api/health',
    expectedStatus: 200,
    validate: (_res, body) => {
      try {
        const json = JSON.parse(body);
        if (json.status !== 'healthy') {
          return `Expected status 'healthy', got '${json.status}'`;
        }
        if (json.database?.status !== 'connected') {
          return `Database disconnected: ${json.database?.error || 'unknown error'}`;
        }
        return null;
      } catch {
        return 'Response is not valid JSON';
      }
    },
  },
  {
    name: 'Authentication Screen (SSR)',
    path: '/login',
    expectedStatus: 200,
    validate: (_res, body) => {
      const hasForm =
        body.includes('password') ||
        body.includes('Manager') ||
        body.includes('Entrar') ||
        body.includes('login');
      if (!hasForm) {
        return 'Login screen HTML did not render expected authentication form elements';
      }
      return null;
    },
  },
  {
    name: 'Public Landing Stats Contract',
    path: '/api/landing-stats',
    expectedStatus: 200,
    validate: (_res, body) => {
      try {
        const json = JSON.parse(body);
        if (!json.success) {
          return 'Expected success: true in response envelope';
        }
        return null;
      } catch {
        return 'Response is not valid JSON';
      }
    },
  },
  {
    name: 'Landing Route Availability',
    path: '/',
    expectedStatus: [200, 307, 308],
  },
];

export async function runProbe(baseUrl: string, probe: SmokeProbe, timeoutMs = 8000): Promise<ProbeResult> {
  const url = `${baseUrl}${probe.path}`;
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BiwengerStats-SmokeCheck/1.0',
        Accept: 'application/json, text/html',
      },
      redirect: 'manual',
    });

    const latencyMs = Date.now() - start;
    const body = await response.text();

    const expectedArr = Array.isArray(probe.expectedStatus)
      ? probe.expectedStatus
      : [probe.expectedStatus];
    const statusMatches = expectedArr.includes(response.status);

    if (!statusMatches) {
      return {
        name: probe.name,
        path: probe.path,
        status: response.status,
        expectedStatus: probe.expectedStatus,
        latencyMs,
        passed: false,
        error: `Expected status ${expectedArr.join('|')}, got ${response.status}`,
      };
    }

    if (probe.validate) {
      const validationError = await probe.validate(response, body);
      if (validationError) {
        return {
          name: probe.name,
          path: probe.path,
          status: response.status,
          expectedStatus: probe.expectedStatus,
          latencyMs,
          passed: false,
          error: validationError,
        };
      }
    }

    return {
      name: probe.name,
      path: probe.path,
      status: response.status,
      expectedStatus: probe.expectedStatus,
      latencyMs,
      passed: true,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const isTimeout = error instanceof Error && error.name === 'AbortError';
    const message = isTimeout
      ? `Request timed out after ${timeoutMs}ms`
      : error instanceof Error
        ? error.message
        : 'Network request failed';

    return {
      name: probe.name,
      path: probe.path,
      status: 0,
      expectedStatus: probe.expectedStatus,
      latencyMs,
      passed: false,
      error: message,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const targetUrl = resolveTargetUrl();
  console.log(`\n🔍 Running Deployment Smoke Checks`);
  console.log(`🌐 Target: ${targetUrl}`);
  console.log(`⏱️  Timestamp: ${new Date().toISOString()}\n`);

  const results: ProbeResult[] = [];
  let allPassed = true;

  for (const probe of PROBES) {
    process.stdout.write(`  • [${probe.name}] ${probe.path} ... `);
    const result = await runProbe(targetUrl, probe);
    results.push(result);

    if (result.passed) {
      console.log(`✅ ${result.status} (${result.latencyMs}ms)`);
    } else {
      allPassed = false;
      console.log(`❌ FAILED (${result.latencyMs}ms)`);
      console.log(`    Reason: ${result.error}`);
    }
  }

  console.log('\n==================================================');
  if (allPassed) {
    console.log(`🎉 ALL SMOKE CHECKS PASSED (${results.length}/${results.length})`);
    console.log('==================================================\n');
    process.exit(0);
  } else {
    const failedCount = results.filter((r) => !r.passed).length;
    console.error(`💥 SMOKE CHECKS FAILED (${failedCount}/${results.length} failed)`);
    console.error('==================================================\n');
    process.exit(1);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error('Fatal smoke test runner error:', err);
    process.exit(1);
  });
}
