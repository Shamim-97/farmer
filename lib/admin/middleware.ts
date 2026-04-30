import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { isPlaceholderEnv } from '@/lib/env';

/**
 * Middleware to protect admin routes
 * Verifies that user is authenticated and has ADMIN role
 */
export async function adminMiddleware(request: NextRequest) {
  if (isPlaceholderEnv()) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }
  try {
    // Get auth from supabase
    const client = await createServerClient();

    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    // Check if user is admin
    const { data: profile } = await client
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}
