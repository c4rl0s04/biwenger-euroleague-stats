import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import authConfig from './auth.config';
import {
  applyAccountStateToAuthToken,
  applyUserToAuthToken,
  createSafeBrowserSession,
  sanitizeAuthToken,
} from '@/lib/auth/session-safety';
import { biwengerCredentials } from '@/lib/credentials/service';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        console.log('LOGIN ATTEMPT:', credentials?.name);

        if (!credentials?.name || !credentials?.password) {
          console.log('LOGIN FAILED: Missing credentials');
          return null;
        }

        // Find user by name
        const user = await db.query.users.findFirst({
          where: eq(users.name, credentials.name),
          columns: {
            id: true,
            name: true,
            email: true,
            password: true,
            icon: true,
          },
        });

        if (!user) {
          console.log('LOGIN FAILED: User not found:', credentials.name);
          return null;
        }

        if (!user.password) {
          console.log('LOGIN FAILED: User has no password set:', credentials.name);
          return null;
        }

        // Compare password
        const isMatch = await bcrypt.compare(credentials.password, user.password);

        if (!isMatch) {
          console.log('LOGIN FAILED: Password mismatch for:', credentials.name);
          return null;
        }

        console.log('LOGIN SUCCESS:', user.name);

        // Return user object for the session
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.icon,
          biwengerLinked: await biwengerCredentials.hasCredential(user.id),
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      let safeToken = applyUserToAuthToken(token, user);

      // Refresh browser-safe account state from the database. Client session
      // update payloads are deliberately ignored.
      if (
        safeToken.id &&
        (trigger === 'update' ||
          safeToken.biwengerLinked === undefined ||
          safeToken.email === undefined)
      ) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, safeToken.id),
            columns: { email: true },
          });
          safeToken = applyAccountStateToAuthToken(safeToken, {
            email: dbUser?.email,
            biwengerLinked: await biwengerCredentials.hasCredential(safeToken.id),
          });
        } catch {
          console.error('Error refreshing safe account state for JWT');
        }
      }

      return sanitizeAuthToken(safeToken);
    },
    async session({ session, token }) {
      return createSafeBrowserSession(session, token);
    },
  },
  session: {
    strategy: 'jwt',
  },
});
