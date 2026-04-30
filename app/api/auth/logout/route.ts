import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isPlaceholderEnv } from '@/lib/env';

export async function POST(request: Request) {
  if (!isPlaceholderEnv()) {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL('/signin', request.url), { status: 303 });
}

export async function GET(request: Request) {
  return POST(request);
}
