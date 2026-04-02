import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pickup Agent - FreshMarket BD',
  description: 'Pickup agent dashboard for FreshMarket BD',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FreshMarket',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  manifest: '/manifest.json',
};

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
