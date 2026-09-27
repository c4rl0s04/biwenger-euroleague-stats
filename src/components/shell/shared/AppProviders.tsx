'use client';

import type { ReactNode } from 'react';
import { UserProvider } from '@/contexts/UserContext';
import { SeasonProvider } from '@/contexts/SeasonContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { CommandPalette } from '@/components/shell/integrations/CommandPalette';

export interface AppUser {
  id?: string | number;
  user_id?: string | number;
  name?: string | null;
  icon?: string | null;
  [key: string]: unknown;
}

export interface AppSeasonItem {
  id: string;
  name?: string;
  active?: boolean;
}

export interface AppSeasonContextProps {
  seasons?: AppSeasonItem[];
  currentSeasonId?: string;
  activeSeasonId?: string;
}

export interface AppProvidersProps {
  children: ReactNode;
  users?: AppUser[];
  seasonContext?: AppSeasonContextProps | null;
}

interface SeasonProviderProps {
  children: ReactNode;
  seasons?: AppSeasonItem[];
  currentSeasonId?: string;
  activeSeasonId?: string;
}

const TypedSeasonProvider = SeasonProvider as React.FC<SeasonProviderProps>;

export function AppProviders({ children, users, seasonContext }: AppProvidersProps) {
  return (
    <UserProvider users={users}>
      <TypedSeasonProvider
        seasons={seasonContext?.seasons}
        currentSeasonId={seasonContext?.currentSeasonId}
        activeSeasonId={seasonContext?.activeSeasonId}
      >
        <CommandPalette />
        <ErrorBoundary>{children}</ErrorBoundary>
      </TypedSeasonProvider>
    </UserProvider>
  );
}

export default AppProviders;
