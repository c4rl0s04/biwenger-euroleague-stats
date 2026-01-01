'use client';

import { UserProvider } from '@/contexts/UserContext';
import { CardThemeProvider } from '@/contexts/CardThemeContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { UserSelectionModal } from '@/components/user';
import ThemeBackground from '@/components/ui/ThemeBackground';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
// Import the effect
import SnowfallEffect from '@/components/ui/SnowfallEffect';

export default function ClientWrapper({ children, users }) {
  return (
    <ThemeProvider>
      <CardThemeProvider>
        <UserProvider users={users}>
          <ThemeBackground />
          {/* Add SnowfallEffect here - it is safe because it is inside ThemeProvider */}
          <SnowfallEffect />
          <UserSelectionModal />
          <ErrorBoundary>{children}</ErrorBoundary>
        </UserProvider>
      </CardThemeProvider>
    </ThemeProvider>
  );
}
