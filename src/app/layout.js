import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { CardThemeProvider } from '@/contexts/CardThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  metadataBase: new URL('https://advanced-euroleague-biwenger-stats.vercel.app'),
  title: {
    default: 'Biwenger Stats - Euroleague Analytics',
    template: '%s | Biwenger Stats',
  },
  description:
    'Advanced financial analytics and performance tracking for Biwenger Euroleague fantasy managers.',
  keywords: ['Biwenger', 'Euroleague', 'Fantasy Basketball', 'Analytics', 'Stats'],
  authors: [{ name: 'Biwenger Stats' }],
  creator: 'Biwenger Stats',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: '/',
    title: 'Biwenger Stats - Euroleague Analytics',
    description: 'Advanced financial analytics and performance tracking for Biwenger Euroleague.',
    siteName: 'Biwenger Stats',
    images: [
      {
        url: '/brand-logo.png', // Fallback image
        width: 1200,
        height: 630,
        alt: 'Biwenger Stats Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Biwenger Stats - Euroleague Analytics',
    description: 'Advanced financial analytics and performance tracking for Biwenger Euroleague.',
    images: ['/brand-logo.png'],
    creator: '@biwengerstats',
  },
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
