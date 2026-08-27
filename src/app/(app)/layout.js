import { getExtendedStandings } from '@/lib/db';
import ClientWrapper from '@/components/layout/ClientWrapper';
import AppShell from '@/components/layout/AppShell';
import { SectionProvider } from '@/components/layout/SectionContext';
import { getPresentationMode } from '@/lib/mobile/presentation-server';

export default async function AppLayout({ children }) {
  // Fetch users for the UserProvider
  const [users, presentationMode] = await Promise.all([
    getExtendedStandings(),
    getPresentationMode(),
  ]);

  return (
    <ClientWrapper users={users}>
      <SectionProvider>
        <AppShell presentationMode={presentationMode}>{children}</AppShell>
      </SectionProvider>
    </ClientWrapper>
  );
}
