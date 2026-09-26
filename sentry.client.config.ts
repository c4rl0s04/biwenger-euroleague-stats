import * as Sentry from '@sentry/nextjs';
import { sanitizeSentryEvent } from './src/lib/observability/sentry';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  beforeSend: sanitizeSentryEvent,
});
