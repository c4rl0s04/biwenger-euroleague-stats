'use client';

import { UserProvider } from '@/contexts/UserContext';
import { CardThemeProvider } from '@/contexts/CardThemeContext';
import UserSelectionModal from '@/components/user/UserSelectionModal';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import ThemeBackground from '@/components/ui/ThemeBackground';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

export default function ClientWrapper({ children, users }) {
  return (
    <CardThemeProvider>
      <UserProvider users={users}>
        <ThemeBackground />
        <UserSelectionModal />
        <ThemeSwitcher />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </UserProvider>
    </CardThemeProvider>
  );
}
