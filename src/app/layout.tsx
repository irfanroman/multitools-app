import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { DashboardProvider } from '@/lib/DashboardContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/layout/AuthGuard';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Data Science Multi-Tool Dashboard',
  description: 'Personal all-in-one dashboard for finance, study tools, data science practice, and mood journal.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`h-full ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <body className="min-h-full flex flex-row bg-[#EDEFEB] text-[#111111] font-sans antialiased selection:bg-[#E4FF6B] selection:text-[#111111] tabular-nums">
        <ThemeProvider>
          <AuthGuard>
            <DashboardProvider>
              {/* Dark Icon-only Sidebar */}
              <Sidebar />

              {/* Main App Canvas */}
              <main className="flex-1 min-w-0 overflow-y-auto h-screen p-4 sm:p-6 lg:p-8 flex flex-col">
                <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">
                  {children}
                </div>
              </main>
            </DashboardProvider>
          </AuthGuard>
        </ThemeProvider>
      </body>
    </html>
  );
}
