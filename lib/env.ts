import { z } from 'zod';

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_TIMEZONE: z.string().default('Asia/Dhaka'),
});

export type Env = z.infer<typeof schema>;

const PLACEHOLDER_MARKERS = ['xxxx', 'your-', 'example.com'];

export function isPlaceholderEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  return (
    !url ||
    !key ||
    PLACEHOLDER_MARKERS.some((m) => url.includes(m) || key.includes(m))
  );
}

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      'Invalid environment configuration:\n' +
        JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );
  }
  cached = parsed.data;
  return cached;
}
