import { Inter } from 'next/font/google';
import './globals.css';
import ClientWrapper from '@/components/layout/ClientWrapper';
import AppShell from '@/components/layout/AppShell';
import { getExtendedStandings } from '@/lib/db';
import { SectionProvider } from '@/components/layout/SectionContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Biwenger Stats',
  description: 'Advanced statistics for your Biwenger league',
  icons: {
    icon: '/favicon.png', // Optimized for small size
    shortcut: '/favicon.png',
    apple: '/brand-logo.png', // Keep the nicer one for Apple Touch Icon
  },
};

// Start of the application
// We fetch server-side data here to pass to the client context
export default function RootLayout({ children }) {
  // Fetch users for the UserProvider
  // Using getExtendedStandings as it contains all active users with their formatting info
  const users = getExtendedStandings();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <ClientWrapper users={users}>
          <SectionProvider>
            <AppShell>{children}</AppShell>
          </SectionProvider>
        </ClientWrapper>
      </body>
    </html>
  );
}
