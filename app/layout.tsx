import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import { createServerClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/auth/helpers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FreshMarket BD',
  description: 'Fresh products marketplace connecting farmers and customers',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FreshMarket',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetch user + profile once on the server.
  // React-cache means nested server components reuse the result.
  let initialUser = null;
  let initialProfile = null;
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    initialUser = user;
    if (user) {
      initialProfile = await getCurrentUserProfile();
    }
  } catch {
    // Missing env or DB unreachable — render anonymously.
  }

  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#059669" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FreshMarket" />
        <link rel="icon" type="image/svg+xml" href="/pwa/icon.svg" />
        <link rel="apple-touch-icon" href="/pwa/icon.svg" />
      </head>
      <body className={inter.className}>
        <AuthProvider initialUser={initialUser} initialProfile={initialProfile}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
