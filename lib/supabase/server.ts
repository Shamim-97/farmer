import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

let adminSingleton: SupabaseClient | null = null;

// Service-role client. NEVER import from client components.
// Lazy: missing env fails at first use, not at module load (build-safe).
export function getSupabaseAdmin(): SupabaseClient {
  if (!adminSingleton) {
    adminSingleton = createClient(url(), serviceRoleKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminSingleton;
}

// Back-compat proxy for existing `supabaseAdmin.from(...)` call sites.
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return Reflect.get(getSupabaseAdmin(), prop);
  },
});

// Server-side anon client tied to the request's session cookies.
// Uses @supabase/ssr so refresh tokens rotate correctly.
export async function createServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createSsrServerClient(url(), anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — Next disallows mutation here.
          // The proxy/route handler will re-set on its own response.
        }
      },
    },
  });
}
