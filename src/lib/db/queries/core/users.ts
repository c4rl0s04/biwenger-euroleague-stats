import { pool as pgClient } from '../../client';

// Retained credential lookup; authentication ownership is a separately gated task.
export async function getUserWithPassword(
  userId: string
): Promise<{ id: string; password: string | null } | undefined> {
  const result = await pgClient.query('SELECT id, password FROM users WHERE id = $1', [userId]);
  return result.rows[0];
}
