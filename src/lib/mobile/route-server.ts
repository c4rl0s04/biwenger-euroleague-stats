import 'server-only';

import { notFound, redirect } from 'next/navigation';

import { getPresentationMode } from './presentation-server';
import { findMobileRoute, getDesktopDestination, type MobileRouteMatch } from './routes';

export async function requireMobileRoute(pathname: string): Promise<MobileRouteMatch> {
  const match = findMobileRoute(pathname);
  if (!match) notFound();

  if ((await getPresentationMode()) === 'desktop') {
    const destination = getDesktopDestination(pathname);
    if (destination) redirect(destination);
  }

  return match;
}
