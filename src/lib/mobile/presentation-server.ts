import 'server-only';

import { headers } from 'next/headers';
import { cache } from 'react';

import { detectPresentationMode, type PresentationMode } from './presentation';

export const getPresentationMode = cache(async (): Promise<PresentationMode> => {
  const requestHeaders = await headers();

  return detectPresentationMode({
    userAgent: requestHeaders.get('user-agent'),
    mobileHint: requestHeaders.get('sec-ch-ua-mobile'),
  });
});

export async function isPhonePresentation(): Promise<boolean> {
  return (await getPresentationMode()) === 'phone';
}
