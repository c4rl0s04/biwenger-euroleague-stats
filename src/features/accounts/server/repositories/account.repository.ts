import 'server-only';

import { db, pgClient } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { biwengerCredentials } from '@/lib/credentials/service';
import { getUserWithPassword as legacyGetUserWithPassword } from '@/lib/db/queries/core/users';
import { prepareUserMutations } from '@/lib/db/mutations/users';

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
    const user = await legacyGetUserWithPassword(userId);
    return user ?? null;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    const mutations = prepareUserMutations(pgClient);
    await mutations.updateUserPassword(passwordHash, userId);
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
