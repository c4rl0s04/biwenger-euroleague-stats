import ClientWrapper from '@/components/layout/ClientWrapper';
import AppShell from '@/components/layout/AppShell';
import { SectionProvider } from '@/components/layout/SectionContext';
import { getPresentationMode } from '@/lib/mobile/presentation-server';
import { getAppStandings, getAppSeasonContext } from '@/lib/services/app/appShellService';

export default async function AppLayout({ children }) {
  // Fetch data for the UserProvider and SeasonProvider
  const [users, presentationMode, seasonContext] = await Promise.all([
    getAppStandings(),
    getPresentationMode(),
    getAppSeasonContext(),
  ]);

  return (
    <ClientWrapper users={users} seasonContext={seasonContext}>
      <SectionProvider>
        <AppShell presentationMode={presentationMode}>{children}</AppShell>
      </SectionProvider>
    </ClientWrapper>
  );
}
