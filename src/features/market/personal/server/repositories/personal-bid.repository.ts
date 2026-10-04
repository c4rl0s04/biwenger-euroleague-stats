import 'server-only';

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { personalBidRules } from '@/lib/db/schema';
import type { PersonalBidRule, PersonalBidStatus } from '../../models/personal-bids';

type Row = typeof personalBidRules.$inferSelect;

function toView(row: Row): PersonalBidRule {
  return {
    id: row.id,
    playerId: row.playerId,
    playerName: row.playerName,
    sellerId: row.sellerId,
    listingPrice: row.listingPrice,
    closesAt: row.closesAt.toISOString(),
    executeAt: row.executeAt.toISOString(),
    amountWithoutBids: row.amountWithoutBids,
    amountWithBids: row.amountWithBids,
    status: row.status as PersonalBidStatus,
    resultCode: row.resultCode,
    submittedAmount: row.submittedAmount,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listPersonalBidRules(userId: string): Promise<PersonalBidRule[]> {
  const rows = await db
    .select()
    .from(personalBidRules)
    .where(eq(personalBidRules.userId, userId))
    .orderBy(desc(personalBidRules.createdAt))
    .limit(100);
  return rows.map(toView);
}

export async function insertPersonalBidRule(row: typeof personalBidRules.$inferInsert) {
  const [saved] = await db.insert(personalBidRules).values(row).returning();
  return toView(saved);
}

export async function attachQueueMessage(id: string, messageId: string) {
  await db
    .update(personalBidRules)
    .set({ queueMessageId: messageId, updatedAt: new Date() })
    .where(and(eq(personalBidRules.id, id), eq(personalBidRules.status, 'pending')));
}

export async function cancelPersonalBidRule(userId: string, id: string) {
  const [row] = await db
    .update(personalBidRules)
    .set({ status: 'cancelled', resultCode: 'cancelled_by_user', updatedAt: new Date() })
    .where(
      and(
        eq(personalBidRules.id, id),
        eq(personalBidRules.userId, userId),
        eq(personalBidRules.status, 'pending')
      )
    )
    .returning();
  return row ? toView(row) : null;
}

export async function claimPersonalBidRule(id: string) {
  const [row] = await db
    .update(personalBidRules)
    .set({ status: 'running', resultCode: 'claim_started', updatedAt: new Date() })
    .where(
      and(
        eq(personalBidRules.id, id),
        eq(personalBidRules.status, 'pending'),
        sql`${personalBidRules.executeAt} <= now()`
      )
    )
    .returning();
  return row ?? null;
}

export async function finishPersonalBidRule(
  id: string,
  status: Exclude<PersonalBidStatus, 'pending' | 'running' | 'cancelled'>,
  resultCode: string,
  submittedAmount: number | null = null
) {
  await db
    .update(personalBidRules)
    .set({ status, resultCode, submittedAmount, updatedAt: new Date() })
    .where(and(eq(personalBidRules.id, id), eq(personalBidRules.status, 'running')));
}

export async function failScheduling(id: string) {
  await db
    .update(personalBidRules)
    .set({ status: 'failed', resultCode: 'queue_publish_failed', updatedAt: new Date() })
    .where(and(eq(personalBidRules.id, id), eq(personalBidRules.status, 'pending')));
}
