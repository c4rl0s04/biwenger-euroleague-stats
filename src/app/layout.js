import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CardThemeProvider } from '@/contexts/CardThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Biwenger Stats',
  description: 'Advanced statistics for your Biwenger league',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/brand-logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen`}>
        <ThemeProvider>
          <CardThemeProvider>{children}</CardThemeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
