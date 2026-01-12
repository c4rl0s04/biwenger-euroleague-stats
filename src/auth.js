import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Access Code',
      credentials: {
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const accessPassword = process.env.ACCESS_PASSWORD;

        // Detailed logging for debugging
        console.log('Auth attempt:', {
          provided: credentials?.password ? '***' : 'undefined',
          stored: accessPassword ? '***' : 'undefined',
          match: credentials?.password === accessPassword,
        });

        if (!accessPassword) {
          console.error('ACCESS_PASSWORD environment variable is not set');
          return null;
        }

        if (credentials.password === accessPassword) {
          return {
            id: '1',
            name: 'Authorized User',
            email: 'admin@biwengerstats.com',
          };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized: async ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth;
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');

      if (isOnLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      return isLoggedIn;
    },
  },
});
