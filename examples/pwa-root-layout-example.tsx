/**
 * Example: Root Layout with PWA Setup
 * Shows how to integrate PWA components and meta tags
 */

import { ReactNode } from 'react';
import { Metadata } from 'next';
import { PWAInstallPrompt } from '@/components/pwa/install-prompt';

/**
 * PWA Metadata
 */
export const metadata: Metadata = {
  title: 'FreshMarket BD - Fresh Vegetables & Organic Produce',
  description:
    'Direct from farmers to your doorstep. Order fresh vegetables, fruits, and organic produce with guaranteed village minimum threshold delivery in Bangladesh.',
  keywords: [
    'vegetables',
    'fresh produce',
    'organic',
    'Bangladesh',
    'delivery',
    'agriculture',
  ],
  authors: [{ name: 'FreshMarket BD' }],
  creator: 'FreshMarket BD',
  publisher: 'FreshMarket BD',

  // PWA Meta Tags
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FreshMarket BD',
  },

  // Icons
  icons: {
    icon: '/pwa/icon-256.png',
    apple: '/pwa/apple-touch-icon-180.png',
  },

  manifest: '/manifest.json',

  // Theme Color
  themeColor: '#0f172a',

  // Open Graph (for sharing)
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    url: 'https://freshmarket-bd.com',
    title: 'FreshMarket BD',
    description:
      'Order fresh vegetables & organic produce with guaranteed delivery threshold in Bangladesh',
    siteName: 'FreshMarket BD',
    images: [
      {
        url: 'https://freshmarket-bd.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'FreshMarket BD',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'FreshMarket BD',
    description:
      'Direct from farmers. Fresh vegetables & organic produce delivery in Bangladesh',
    creator: '@freshmarketbd',
    images: ['https://freshmarket-bd.com/og-image.png'],
  },

  // Viewport Configuration
  viewport: {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    maximumScale: 5,
  },
};

/**
 * Root Layout Component
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FreshMarket BD" />
        <meta name="apple-mobile-web-app-icon-smooth-cornered" content="yes" />

        {/* Apple Icons */}
        <link rel="apple-touch-icon" href="/pwa/icon-192.png" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/pwa/apple-touch-icon-180.png"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/pwa/icon-256.png"
        />

        {/* Service Worker */}
        <link rel="serviceworker" href="/sw.js" />

        {/* DNS Prefetch for Performance */}
        <link rel="dns-prefetch" href="//cdn.example.com" />
        <link rel="preconnect" href="//api.example.com" />

        {/* Canonical URL */}
        <link rel="canonical" href="https://freshmarket-bd.com" />

        {/* Alternate Language Links */}
        <link rel="alternate" hrefLang="en" href="https://freshmarket-bd.com" />
        <link rel="alternate" hrefLang="bn" href="https://freshmarket-bd.com/bn" />
      </head>

      <body suppressHydrationWarning>
        {/* Main App Content */}
        {children}

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />

        {/* Service Worker Registration Script */}
        <ServiceWorkerScript />
      </body>
    </html>
  );
}

/**
 * Service Worker Registration Component
 */
function ServiceWorkerScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js', {
                scope: '/',
              })
              .then((reg) => {
                console.log('[PWA] Service Worker registered successfully:', reg);
                
                // Check for updates periodically
                setInterval(() => {
                  reg.update();
                }, 60000); // Check every minute
              })
              .catch((err) => {
                console.error('[PWA] Service Worker registration failed:', err);
              });
              
              // Listen for messages from service worker
              navigator.serviceWorker.onmessage = (event) => {
                if (event.data.type === 'UPDATE_AVAILABLE') {
                  console.log('[PWA] New version available');
                  // Show update notification if needed
                }
              };
            });
          } else {
            console.log('[PWA] Service Workers not supported');
          }
        `,
      }}
    />
  );
}
