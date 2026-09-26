import { AppProviders } from '@/components/shell/shared/AppProviders';
import { SectionProvider } from '@/components/shell/shared/SectionContext';
import { AppShell } from '@/components/shell/AppShell';
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
    <AppProviders users={users} seasonContext={seasonContext}>
      <SectionProvider>
        <AppShell presentationMode={presentationMode}>{children}</AppShell>
      </SectionProvider>
    </AppProviders>
  );
}
