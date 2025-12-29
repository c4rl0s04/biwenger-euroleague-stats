import { Navbar, ClientWrapper } from '@/components/layout';
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
    <html lang="es" className="dark">
      <body
        className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col`}
      >
        <ClientWrapper users={users}>
          <Navbar />
          <main className="flex-grow w-full">{children}</main>
          <footer className="border-t border-slate-800/50 mt-auto bg-slate-950/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-slate-500 text-sm">
                  © 2025 BiwengerStats. Análisis avanzado de Euroliga.
                </p>
              </div>
            </div>
          </footer>
        </ClientWrapper>
      </body>
    </html>
  );
}
