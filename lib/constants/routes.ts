// Route gates used by proxy.ts. Use prefixes — `startsWith` matches.
// Routes outside these lists require authentication.

export const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/signup',
  '/products',
  '/auth/callback',
  '/api/auth/callback',
  '/manifest.json',
  '/sw.js',
] as const;

export const SELLER_ONLY_ROUTES = ['/seller'] as const;
export const ADMIN_ONLY_ROUTES = ['/admin'] as const;
export const AGENT_ONLY_ROUTES = ['/agent'] as const;
