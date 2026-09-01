import 'server-only';

import { and, count, eq, isNotNull, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { userBiwengerCredentials, users } from '@/lib/db/schema';
import type { CredentialEnvelope, CredentialRecordRepository, StoredCredential } from './types';

function toStoredCredential(row: typeof userBiwengerCredentials.$inferSelect): StoredCredential {
  return {
    userId: row.userId,
    version: row.version,
    keyId: row.keyId,
    ciphertext: row.ciphertext,
    iv: row.iv,
    authTag: row.authTag,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCredentialRepository implements CredentialRecordRepository {
  async hasEncrypted(userId: string): Promise<boolean> {
    const row = await db.query.userBiwengerCredentials.findFirst({
      where: eq(userBiwengerCredentials.userId, userId),
      columns: { userId: true },
    });
    return Boolean(row);
  }

  async findEncrypted(userId: string): Promise<StoredCredential | null> {
    const row = await db.query.userBiwengerCredentials.findFirst({
      where: eq(userBiwengerCredentials.userId, userId),
    });
    return row ? toStoredCredential(row) : null;
  }

  async findLegacyPlaintext(userId: string): Promise<string | null> {
    const row = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });
    return row?.biwengerToken ?? null;
  }

  async hasLegacyPlaintext(userId: string): Promise<boolean> {
    const row = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { biwengerToken: true },
    });
    return Boolean(row?.biwengerToken);
  }

  async replaceCredential(
    userId: string,
    envelope: CredentialEnvelope,
    email?: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .insert(userBiwengerCredentials)
        .values({ userId, ...envelope })
        .onConflictDoUpdate({
          target: userBiwengerCredentials.userId,
          set: { ...envelope, updatedAt: new Date() },
        });

      await tx
        .update(users)
        .set({ biwengerToken: null, ...(email !== undefined ? { email } : {}) })
        .where(eq(users.id, userId));
    });
  }

  async deleteCredential(userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(userBiwengerCredentials).where(eq(userBiwengerCredentials.userId, userId));
      await tx.update(users).set({ biwengerToken: null }).where(eq(users.id, userId));
    });
  }
}

import type { CredentialMaintenanceRepository, LegacyCredentialCandidate } from './maintenance';

export async function listLegacyCredentialCandidates(
  afterUserId: string | undefined,
  limit: number
): Promise<LegacyCredentialCandidate[]> {
  const rows = await db
    .select({ userId: users.id, plaintext: users.biwengerToken })
    .from(users)
    .where(
      and(
        isNotNull(users.biwengerToken),
        afterUserId ? sql`${users.id} > ${afterUserId}` : sql`true`
      )
    )
    .orderBy(users.id)
    .limit(limit);

  return rows.flatMap((row) =>
    row.plaintext ? [{ userId: row.userId, plaintext: row.plaintext }] : []
  );
}

export async function storeMigratedCredential(
  userId: string,
  envelope: CredentialEnvelope
): Promise<'created' | 'already_exists'> {
  const inserted = await db
    .insert(userBiwengerCredentials)
    .values({ userId, ...envelope })
    .onConflictDoNothing({ target: userBiwengerCredentials.userId })
    .returning({ userId: userBiwengerCredentials.userId });
  return inserted.length === 1 ? 'created' : 'already_exists';
}

export async function listCredentialsForRotation(
  activeKeyId: string,
  afterUserId: string | undefined,
  limit: number
): Promise<StoredCredential[]> {
  const rows = await db
    .select()
    .from(userBiwengerCredentials)
    .where(
      and(
        ne(userBiwengerCredentials.keyId, activeKeyId),
        afterUserId ? sql`${userBiwengerCredentials.userId} > ${afterUserId}` : sql`true`
      )
    )
    .orderBy(userBiwengerCredentials.userId)
    .limit(limit);
  return rows.map(toStoredCredential);
}

export async function storeRotatedCredential(
  current: StoredCredential,
  replacement: CredentialEnvelope
): Promise<boolean> {
  const result = await db
    .update(userBiwengerCredentials)
    .set({ ...replacement, updatedAt: new Date() })
    .where(
      and(
        eq(userBiwengerCredentials.userId, current.userId),
        eq(userBiwengerCredentials.keyId, current.keyId),
        eq(userBiwengerCredentials.version, current.version),
        eq(userBiwengerCredentials.ciphertext, current.ciphertext),
        eq(userBiwengerCredentials.iv, current.iv),
        eq(userBiwengerCredentials.authTag, current.authTag)
      )
    )
    .returning({ userId: userBiwengerCredentials.userId });
  return result.length === 1;
}

export const databaseCredentialMaintenanceRepository: CredentialMaintenanceRepository = {
  listLegacy: listLegacyCredentialCandidates,
  findEncrypted: (userId) => new DrizzleCredentialRepository().findEncrypted(userId),
  storeMigrated: storeMigratedCredential,
  listForRotation: listCredentialsForRotation,
  storeRotated: storeRotatedCredential,
};

export async function getCredentialStorageStatus(): Promise<{
  legacyPlaintextRecords: number;
  encryptedRecords: number;
  keyUsage: Array<{ keyId: string; records: number }>;
}> {
  const [legacyResult, encryptedResult, keyUsage] = await Promise.all([
    db.select({ records: count() }).from(users).where(isNotNull(users.biwengerToken)),
    db.select({ records: count() }).from(userBiwengerCredentials),
    db
      .select({ keyId: userBiwengerCredentials.keyId, records: count() })
      .from(userBiwengerCredentials)
      .groupBy(userBiwengerCredentials.keyId)
      .orderBy(userBiwengerCredentials.keyId),
  ]);

  return {
    legacyPlaintextRecords: legacyResult[0]?.records ?? 0,
    encryptedRecords: encryptedResult[0]?.records ?? 0,
    keyUsage,
  };
}
