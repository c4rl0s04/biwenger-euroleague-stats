import { AppProviders } from '@/components/shell/shared/AppProviders';
import { SectionProvider } from '@/components/shell/shared/SectionContext';
import { AppShell } from '@/components/shell/AppShell';
import { getPresentationMode } from '@/lib/mobile/presentation-server';
import { getRequestStandings } from '@/features/standings/server';
import { getRequestSeasonContext } from '@/lib/seasons/server';

export default async function AppLayout({ children }) {
  // Fetch data for the UserProvider and SeasonProvider
  const [users, presentationMode, seasonContext] = await Promise.all([
    getRequestStandings(),
    getPresentationMode(),
    getRequestSeasonContext(),
  ]);

  return (
    <AppProviders users={users} seasonContext={seasonContext}>
      <SectionProvider>
        <AppShell presentationMode={presentationMode}>{children}</AppShell>
      </SectionProvider>
    </AppProviders>
  );
}
