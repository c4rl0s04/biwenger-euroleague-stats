import 'server-only';

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Internal authentication reads. No caching: login and JWT refresh observe current account state.
export async function findLoginAccount(name: string): Promise<
  | {
      id: string;
      name: string | null;
      email: string | null;
      password: string | null;
    }
  | undefined
> {
  return db.query.users.findFirst({
    where: eq(users.name, name),
    columns: { id: true, name: true, email: true, password: true },
  });
}

export async function findSessionAccount(
  id: string
): Promise<{ email: string | null } | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id), columns: { email: true } });
}
