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
          image: user.icon,
          biwengerToken: user.biwengerToken,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
});
