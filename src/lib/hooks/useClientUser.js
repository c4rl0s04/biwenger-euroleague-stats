import { useSyncExternalStore } from 'react';
import { useUser } from '@/contexts/UserContext';

// Subscription function for useSyncExternalStore (no-op - value never changes)
const emptySubscribe = () => () => {};

// These functions determine if we're mounted (client-side)
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook that combines client-side detection with user context.
 * Returns isReady=false on server and when user is not loaded.
 * Use this in components that depend on currentUser from localStorage.
 *
 * @returns {{ isReady: boolean, currentUser: object | null, ...rest }}
 */
export function useClientUser() {
  const isClient = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const userContext = useUser();

  return {
    ...userContext,
    isReady: isClient && !!userContext.currentUser,
  };
}
