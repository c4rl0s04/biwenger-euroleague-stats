import 'server-only';

import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { findLoginAccount, findSessionAccount } from '@/lib/auth/repository';
import bcrypt from 'bcryptjs';
import authConfig from './auth.config';
import {
  applyAccountStateToAuthToken,
  applyUserToAuthToken,
  createSafeBrowserSession,
  sanitizeAuthToken,
} from '@/lib/auth/session-safety';
import { biwengerCredentials } from '@/lib/credentials/server';

// Match the current password cost even for accounts without a stored password.
const fallbackPasswordHash = '$2b$10$M3mpDAd335nmtoh5kt29JOwU8MlKXirolvgOjXgeYm2Lk.Bl2TMMy';

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { name, password } = credentials ?? {};
        if (
          typeof name !== 'string' ||
          name.length === 0 ||
          name.length > 256 ||
          typeof password !== 'string' ||
          password.length === 0 ||
          password.length > 1024
        ) {
          return null;
        }

        try {
          const user = await findLoginAccount(name);
          const isMatch = await bcrypt.compare(password, user?.password || fallbackPasswordHash);
          if (!user?.password || !isMatch) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: null,
            biwengerLinked: await biwengerCredentials.hasCredential(user.id),
          };
        } catch {
          // Database errors may include SQL parameters containing the submitted name.
          console.error('Credential sign-in unavailable');
          return null;
        }
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
          const dbUser = await findSessionAccount(safeToken.id);
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
