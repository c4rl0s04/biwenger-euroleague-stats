const authConfig = {
  trustHost: true,
  providers: [],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // 1. Allow all API Auth routes
      if (pathname.startsWith('/api/auth')) return true;

      // 2. Allow Login page
      if (pathname === '/login') return true;

      // 3. Allow Next.js internals and static public assets
      if (
        pathname.startsWith('/_next/') ||
        pathname.startsWith('/favicon') ||
        /\.(png|jpg|jpeg|svg|ico|webp|gif|woff2?|ttf|otf)$/.test(pathname)
      ) {
        return true;
      }

      // 4. Everything else requires login
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};

export default authConfig;
