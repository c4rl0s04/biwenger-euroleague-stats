'use client';

import { UserProvider } from '@/contexts/UserContext';
import { CardThemeProvider } from '@/contexts/CardThemeContext';
import { UserSelectionModal } from '@/components/user';
import { ThemeSwitcher, ThemeBackground, ErrorBoundary } from '@/components/ui';

export default function ClientWrapper({ children, users }) {
  return (
    <CardThemeProvider>
      <UserProvider users={users}>
        <ThemeBackground />
        <UserSelectionModal />
        <ThemeSwitcher />
        <ErrorBoundary>{children}</ErrorBoundary>
      </UserProvider>
    </CardThemeProvider>
  );
}
