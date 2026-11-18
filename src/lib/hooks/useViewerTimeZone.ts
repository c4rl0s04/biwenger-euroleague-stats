'use client';

import { useSyncExternalStore } from 'react';
import { SERVER_EVENT_TIME_ZONE } from '@/lib/utils/event-time';

// The browser zone is a snapshot. No app state needs to be subscribed to.
const subscribe = () => () => {};
const getBrowserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || SERVER_EVENT_TIME_ZONE;
const getServerTimeZone = () => SERVER_EVENT_TIME_ZONE;

export function useViewerTimeZone() {
  return useSyncExternalStore(subscribe, getBrowserTimeZone, getServerTimeZone);
}
