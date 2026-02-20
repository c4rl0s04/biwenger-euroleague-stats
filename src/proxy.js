import { auth } from './auth';

export default auth;

export const config = {
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login).*)'],
};
