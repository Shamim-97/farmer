import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Pickup Agent - FreshMarket BD',
  description: 'Pickup agent dashboard for FreshMarket BD',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FreshMarket',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
