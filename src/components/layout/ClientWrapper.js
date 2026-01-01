'use client';

import { UserProvider } from '@/contexts/UserContext';
import { CardThemeProvider } from '@/contexts/CardThemeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserSelectionModal } from '@/components/user';
import ThemeBackground from '@/components/ui/ThemeBackground';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import SnowfallEffect from '@/components/ui/SnowfallEffect';
import CommandPalette from '@/components/ui/CommandPalette';

export default function ClientWrapper({ children, users }) {
  return (
    <ThemeProvider>
      <CardThemeProvider>
        <UserProvider users={users}>
          <ThemeBackground />
          <SnowfallEffect />
          <CommandPalette /> {/* Add this line */}
          <UserSelectionModal />
          <ErrorBoundary>{children}</ErrorBoundary>
        </UserProvider>
      </CardThemeProvider>
    </ThemeProvider>
  );
}
