import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ⚠️ IMPORTANT: Service role client should ONLY be used in server-side actions
// and Edge Functions for bypassing RLS. Never expose to client.
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Server-side client with session from cookies
export async function createServerClient() {
  const cookieStore = await cookies();

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          cookie: cookieStore
            .getAll()
            .map(({ name, value }) => `${name}=${value}`)
            .join('; '),
        },
      },
    }
  );
}
