import { useSyncExternalStore } from 'react';
import { useUser } from '@/contexts/UserContext';

// Subscription function for useSyncExternalStore (no-op - value never changes)
const emptySubscribe = () => () => {};

// These functions determine if we're mounted (client-side)
const getSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Hook that combines client-side detection with user context.
 * Use this in components that depend on currentUser from localStorage.
 *
 * @returns {{
 *   isClient: boolean - true on client after hydration
 *   isReady: boolean - true when client AND user is loaded
 *   currentUser: object | null
 *   selectUser: function
 *   clearUser: function
 *   users: array
 * }}
 */
export function useClientUser() {
  const isClient = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);
  const userContext = useUser();

  return {
    ...userContext,
    isClient, // True on client, false on server
    isReady: isClient && !!userContext.currentUser, // True when client + user exists
  };
}
