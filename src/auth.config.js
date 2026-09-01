import {
  applyUserToAuthToken,
  createSafeBrowserSession,
  sanitizeAuthToken,
} from '@/lib/auth/session-safety';

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
    async jwt({ token, user }) {
      return sanitizeAuthToken(applyUserToAuthToken(token, user));
    },
    async session({ session, token }) {
      return createSafeBrowserSession(session, token);
    },
  },
};

export default authConfig;
