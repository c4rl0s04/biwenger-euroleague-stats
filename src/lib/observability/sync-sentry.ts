import * as Sentry from '@sentry/node';
import { redactSensitiveData, sanitizeSentryEvent } from './sentry-redaction';

export interface SyncErrorContext {
  stepId?: string;
  stepTitle?: string;
  seasonId?: string;
  syncMode?: string;
  durationMs?: number;
  warningsCount?: number;
  counts?: Record<string, number>;
  extra?: Record<string, unknown>;
}

/**
 * Captures background sync and crawler errors with structured tags and execution metrics.
 */
export function captureSyncError(
  error: unknown,
  context: SyncErrorContext = {}
): string | undefined {
  if (!Sentry.getClient()) return undefined;

  const err = error instanceof Error ? error : new Error(String(error || 'Unknown sync error'));

  // Never crash during error reporting
  try {
    return Sentry.captureException(err, {
      tags: {
        component: 'sync-manager',
        ...(context.stepId ? { syncStep: context.stepId } : {}),
        ...(context.seasonId ? { seasonId: context.seasonId } : {}),
        ...(context.syncMode ? { syncMode: context.syncMode } : {}),
      },
      extra: redactSensitiveData({
        stepTitle: context.stepTitle,
        durationMs: context.durationMs,
        warningsCount: context.warningsCount,
        counts: context.counts,
        ...context.extra,
      }),
    });
  } catch {
    console.error('Failed to capture sync error in Sentry.');
    return undefined;
  }
}

function redactSyncMessage(message: string): string {
  for (const [key, value] of Object.entries(process.env)) {
    if (
      value &&
      /(?:token|password|secret|api_?key|credential|database_url|postgres_url|sentry_dsn)/i.test(
        key
      )
    ) {
      message = message.replaceAll(value, '[REDACTED]');
    }
  }
  return redactSensitiveData(message);
}

export async function runSyncCli(
  run: () => Promise<number | void>,
  failureStep: string,
  failureMessage: string
): Promise<number> {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (dsn) {
    try {
      if (!/^https?:\/\/\w+@[\w.-]+(?::\d+)?\/(?:[^\s]*\/)?\d+$/.test(dsn)) {
        throw new Error('Invalid sync Sentry DSN');
      }
      Sentry.init({
        dsn,
        defaultIntegrations: false,
        beforeSend(event) {
          for (const exception of event.exception?.values ?? []) {
            if (exception.value) exception.value = redactSyncMessage(exception.value);
          }
          return sanitizeSentryEvent(event);
        },
      });
    } catch {
      console.error('Could not initialize Sentry for sync.');
    }
  }

  try {
    return (await run()) ?? 0;
  } catch (error) {
    console.error(
      failureMessage,
      redactSyncMessage(error instanceof Error ? error.message : String(error))
    );
    captureSyncError(error, { stepId: failureStep });
    return 1;
  } finally {
    if (Sentry.getClient()) {
      try {
        if (!(await Sentry.flush(2000))) console.error('Sync Sentry flush timed out.');
      } catch {
        console.error('Could not flush sync events to Sentry.');
      }
    }
  }
}
