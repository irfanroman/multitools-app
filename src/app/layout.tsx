import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { DashboardProvider } from '@/lib/DashboardContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ServiceWorkerRegister } from '@/components/pwa/ServiceWorkerRegister';

// Plus Jakarta Sans is a variable font (200-800). Omitting `weight` ships ONE
// variable file covering every weight the UI uses, instead of the five static
// files the explicit weight list was requesting.
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  applicationName: 'MultiTools Suite',
  title: {
    default: 'Data Science & Multi-Tool Dashboard',
    template: '%s | MultiTools',
  },
  description:
    'Personal all-in-one dashboard for finance, study tools, data science practice, and mindful journal.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MultiTools',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#EDEFEB' },
    { media: '(prefers-color-scheme: dark)', color: '#0D0F12' },
  ],
};

/**
 * Runs before first paint, so the correct theme class is on <html> when the
 * browser computes styles. Without it the page paints light, then React
 * hydrates and swaps to dark — a full-screen flash on every load.
 */
const THEME_BOOTSTRAP = `(function(){try{var t=localStorage.getItem('dashboard_theme');if(t==='dark'){document.documentElement.classList.add('dark')}}catch(e){}})()`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className="min-h-full flex flex-col md:flex-row font-sans antialiased tabular-nums selection:bg-lime-400 selection:text-black touch-manipulation">
        <ServiceWorkerRegister />
        <ThemeProvider>
          {/* Provider sits ABOVE the guard so the data fetch starts in parallel
              with the session check instead of waiting a full round-trip. */}
          <DashboardProvider>
            <AuthGuard>
              {/* Sidebar: vertical on desktop, bottom navigation bar on mobile */}
              <Sidebar />

              {/* Main App Canvas */}
              <main className="flex-1 min-w-0 overflow-y-auto min-h-screen pb-24 md:pb-8 p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
                  {children}
                </div>
              </main>
            </AuthGuard>
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
