import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import authConfig from './auth.config';

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
          biwengerToken: user.biwengerToken,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session: sessionData }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.biwengerToken = user.biwengerToken;
      }

      // If biwengerToken or email is missing but we have an id, refresh from DB
      // This helps with existing sessions after a schema/logic update
      if (token.id && (!token.biwengerToken || token.email === undefined)) {
        try {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, token.id),
          });
          if (dbUser) {
            token.biwengerToken = dbUser.biwengerToken;
            token.email = dbUser.email;
          }
        } catch (e) {
          console.error('Error auto-refreshing JWT from DB:', e);
        }
      }

      if (trigger === 'update' && sessionData) {
        if (sessionData.biwengerToken) token.biwengerToken = sessionData.biwengerToken;
        if (sessionData.email) token.email = sessionData.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.biwengerToken = token.biwengerToken;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
});
