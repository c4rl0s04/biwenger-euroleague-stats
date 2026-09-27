'use client';

import type { ReactNode } from 'react';
import { UserProvider, type UserOption } from '@/contexts/UserContext';
import { SeasonProvider, type SeasonSelection } from '@/contexts/SeasonContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CommandPalette } from '@/components/shell/integrations/CommandPalette';

export interface AppProvidersProps {
  children: ReactNode;
  users?: UserOption[];
  seasonContext?: SeasonSelection | null;
}

export function AppProviders({ children, users, seasonContext }: AppProvidersProps) {
  return (
    <UserProvider users={users}>
      <SeasonProvider
        seasons={seasonContext?.seasons}
        currentSeasonId={seasonContext?.currentSeasonId}
        activeSeasonId={seasonContext?.activeSeasonId}
      >
        <CommandPalette />
        <ErrorBoundary>{children}</ErrorBoundary>
      </SeasonProvider>
    </UserProvider>
  );
}

export default AppProviders;
