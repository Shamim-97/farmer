import { createBrowserClient as createSsrBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// NOTE: SupabaseClient is intentionally untyped (no <Database> generic).
// Postgrest-js's embed inference needs FK relationship metadata that
// `supabase gen types typescript` produces. Until that lands in CI, leaving
// the client untyped keeps embed-heavy queries from cascading into TS errors.
// `database.types.ts` is still exported so call-sites can cast results
// explicitly via `as unknown as ProfileRow` / etc.
let browserClient: SupabaseClient | null = null;

export function createBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    return createSsrBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  if (!browserClient) {
    browserClient = createSsrBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return browserClient;
}

export const supabase: SupabaseClient = createBrowserClient();

export type { Database };
