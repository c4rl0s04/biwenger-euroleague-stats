const PUBLIC_PWA_PATHS = new Set([
  '/login',
  '/install',
  '/offline',
  '/sw.js',
  '/manifest.webmanifest',
]);

export function isPublicPath(pathname) {
  if (PUBLIC_PWA_PATHS.has(pathname)) return true;
  if (pathname.startsWith('/api/auth')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname.startsWith('/_vercel/')) return true;
  if (pathname.startsWith('/icons/')) return true;
  if (pathname.startsWith('/favicon') || pathname === '/brand-logo.png') return true;

  return /\.(png|jpg|jpeg|svg|ico|webp|gif|woff2?|ttf|otf)$/.test(pathname);
}

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

      if (isPublicPath(pathname)) return true;

      // Everything else requires login
      return isLoggedIn;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.biwengerToken = user.biwengerToken;
      }
      // Handle session update
      if (trigger === 'update' && session) {
        if (session.biwengerToken) token.biwengerToken = session.biwengerToken;
        if (session.email) token.email = session.email;
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
};

export default authConfig;
