'use client';

import type { ReactNode } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { SeasonProvider } from '@/contexts/SeasonContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CommandPalette } from '@/components/shell/integrations/CommandPalette';

export interface AppSeasonContextProps {
  seasons?: Array<{ id: string; name?: string; active?: boolean }>;
  currentSeasonId?: string;
  activeSeasonId?: string;
}

export interface AppProvidersProps {
  children: ReactNode;
  users?: unknown[];
  seasonContext?: AppSeasonContextProps | null;
}

const AnySeasonProvider = SeasonProvider as React.ComponentType<{
  children: ReactNode;
  seasons?: Array<{ id: string; name?: string; active?: boolean }>;
  currentSeasonId?: string;
  activeSeasonId?: string;
}>;

export function AppProviders({ children, users, seasonContext }: AppProvidersProps) {
  return (
    <UserProvider users={users}>
      <AnySeasonProvider
        seasons={seasonContext?.seasons}
        currentSeasonId={seasonContext?.currentSeasonId}
        activeSeasonId={seasonContext?.activeSeasonId}
      >
        <CommandPalette />
        <ErrorBoundary>{children}</ErrorBoundary>
      </AnySeasonProvider>
    </UserProvider>
  );
}

export default AppProviders;
