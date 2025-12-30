import AppShell from '@/components/layout/AppShell';
import ClientWrapper from '@/components/layout/ClientWrapper';
import { getStandings } from '@/lib/db';
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Biwenger Stats',
  description: 'Advanced analytics for your Biwenger league',
};

export default function RootLayout({ children }) {
  // Fetch users for the UserProvider
  const users = getStandings();

  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <ClientWrapper users={users}>
          <AppShell>{children}</AppShell>
        </ClientWrapper>
      </body>
    </html>
  );
}
