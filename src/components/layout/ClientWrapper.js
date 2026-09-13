'use client';

import { UserProvider } from '@/contexts/UserContext';
import { SeasonProvider } from '@/contexts/SeasonContext';
import ThemeBackground from '@/components/ui/ThemeBackground';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import CommandPalette from '@/components/ui/CommandPalette';

export default function ClientWrapper({ children, users, seasonContext }) {
  return (
    <UserProvider users={users}>
      <SeasonProvider
        seasons={seasonContext?.seasons}
        currentSeasonId={seasonContext?.currentSeasonId}
        activeSeasonId={seasonContext?.activeSeasonId}
      >
        <ThemeBackground />
        <CommandPalette />
        <ErrorBoundary>{children}</ErrorBoundary>
      </SeasonProvider>
    </UserProvider>
  );
}
