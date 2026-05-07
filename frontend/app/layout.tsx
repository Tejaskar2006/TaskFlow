import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SocketProvider } from '@/components/providers/SocketProvider';

export const metadata: Metadata = {
  title: 'TaskFlow - Team Task Manager',
  description: 'A powerful team task management platform. Organize projects, assign tasks, and collaborate with your team using a visual Kanban board.',
  keywords: ['task manager', 'project management', 'kanban', 'team collaboration'],
  authors: [{ name: 'TaskFlow' }],
  openGraph: {
    title: 'TaskFlow - Team Task Manager',
    description: 'Organize projects, assign tasks, and collaborate with your team.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="font-sans antialiased app-shell">
        <ThemeProvider>
          <AuthProvider>
            <SocketProvider>
              {children}
              <Toaster
                position="top-right"
                richColors
                closeButton
                duration={4000}
                toastOptions={{
                  style: {
                    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
                  },
                }}
              />
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
