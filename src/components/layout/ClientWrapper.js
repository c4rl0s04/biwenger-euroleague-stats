'use client';

import { UserProvider } from '@/contexts/UserContext';
import ThemeBackground from '@/components/ui/ThemeBackground';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import CommandPalette from '@/components/ui/CommandPalette';

export default function ClientWrapper({ children, users }) {
  return (
    <UserProvider users={users}>
      <ThemeBackground />
      <CommandPalette />
      <ErrorBoundary>{children}</ErrorBoundary>
    </UserProvider>
  );
}
