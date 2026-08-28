import { z } from 'zod';

import { HOME_ACTIVITY_FILTERS, type HomeActivityFilter } from './contracts';

const cursorSchema = z.object({
  occurredAt: z.string().datetime({ offset: true }),
  id: z
    .string()
    .min(3)
    .max(160)
    .regex(/^[a-z_]+:[A-Za-z0-9:._-]+$/),
  filter: z.enum(HOME_ACTIVITY_FILTERS),
});

export type HomeFeedCursor = z.infer<typeof cursorSchema>;

export function encodeHomeFeedCursor(cursor: HomeFeedCursor): string {
  const parsed = cursorSchema.parse(cursor);
  return Buffer.from(JSON.stringify(parsed), 'utf8').toString('base64url');
}

export function decodeHomeFeedCursor(
  value: string,
  expectedFilter?: HomeActivityFilter
): HomeFeedCursor {
  try {
    if (!value || value.length > 512) throw new Error('invalid length');
    const decoded = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    const parsed = cursorSchema.parse(decoded);
    if (expectedFilter && parsed.filter !== expectedFilter) throw new Error('filter mismatch');
    return parsed;
  } catch {
    throw new Error('Cursor de actividad no válido');
  }
}
