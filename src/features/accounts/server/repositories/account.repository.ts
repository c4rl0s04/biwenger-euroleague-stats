import 'server-only';

import { db, pgClient } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { biwengerCredentials } from '@/lib/credentials/server';

export interface UserAccountRecord {
  id: string;
  name: string | null;
  email: string | null;
}

export interface UserWithPasswordRecord {
  id: string;
  password: string | null;
}

export class AccountRepository {
  async getUserById(userId: string): Promise<UserAccountRecord | null> {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, name: true, email: true },
    });
    return (user as UserAccountRecord) ?? null;
  }

  async getUserWithPassword(userId: string): Promise<UserWithPasswordRecord | null> {
    const result = await pgClient.query<UserWithPasswordRecord>(
      'SELECT id, password FROM users WHERE id = $1',
      [userId]
    );
    const user = result.rows[0];
    return user ?? null;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await pgClient.query('UPDATE users SET password = $1 WHERE id = $2', [passwordHash, userId]);
  }

  async storeBiwengerCredential(userId: string, token: string, email?: string): Promise<void> {
    await biwengerCredentials.storeCredential({
      userId,
      credential: token,
      email,
    });
  }
}

export const accountRepository = new AccountRepository();
