import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/db/health';

export const dynamic = 'force-dynamic';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function GET() {
  const dbHealth = await checkDatabaseHealth();
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  if (!dbHealth.ok) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp,
        uptime,
        database: {
          status: 'disconnected',
          latencyMs: dbHealth.latencyMs,
          error: dbHealth.error,
        },
      },
      {
        status: 503,
        headers: NO_CACHE_HEADERS,
      }
    );
  }

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp,
      uptime,
      database: {
        status: 'connected',
        latencyMs: dbHealth.latencyMs,
      },
      version: process.env.npm_package_version || '0.1.0',
    },
    {
      status: 200,
      headers: NO_CACHE_HEADERS,
    }
  );
}
