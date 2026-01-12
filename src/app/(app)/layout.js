import { getExtendedStandings } from '@/lib/db';
import ClientWrapper from '@/components/layout/ClientWrapper';
import AppShell from '@/components/layout/AppShell';
import { SectionProvider } from '@/components/layout/SectionContext';

export default async function AppLayout({ children }) {
  // Fetch users for the UserProvider
  const users = await getExtendedStandings();

  return (
    <ClientWrapper users={users}>
      <SectionProvider>
        <AppShell>{children}</AppShell>
      </SectionProvider>
    </ClientWrapper>
  );
}
