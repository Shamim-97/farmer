import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  SELLER_ONLY_ROUTES,
  ADMIN_ONLY_ROUTES,
  AGENT_ONLY_ROUTES,
  PUBLIC_ROUTES,
} from '@/lib/types/auth';

/**
 * Middleware for role-based route protection and business rule enforcement
 *
 * Rules enforced:
 * - THE 10 PM LOCK: Orders disabled after 22:00 Bangladesh time
 * - THE NID GATE: Sellers can't access /seller/* without APPROVED NID
 * - Role-based route access control
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes without authentication check
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get session from Supabase
  const client = await createServerClient();

  const {
    data: { user },
  } = await client.auth.getUser();

  // No user found - redirect to signin
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  // Fetch user's profile for role check
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, role, nid_status')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    // Profile doesn't exist yet - redirect to onboarding
    return NextResponse.redirect(new URL('/auth/onboarding', request.url));
  }

  // ===================================================
  // RULE 1: THE 10 PM LOCK
  // Enforce cutoff for order placement routes
  // ===================================================

  if (pathname === '/checkout' || pathname.startsWith('/cart')) {
    const dhakaTz = 'Asia/Dhaka';
    const now = new Date();

    // Convert to Bangladesh time (UTC+6)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: dhakaTz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const timeStr = formatter.format(now);
    const [hour, minute] = timeStr.split(':').map(Number);
    const currentTimeInMinutes = hour * 60 + minute;
    const cutoffTimeInMinutes = 22 * 60; // 22:00 (10 PM)

    if (currentTimeInMinutes >= cutoffTimeInMinutes) {
      // After cutoff - block access and set error header
      return NextResponse.next({
        headers: {
          'x-order-blocked': 'true',
          'x-block-reason': '10-pm-lock',
        },
      });
    }
  }

  // ===================================================
  // RULE 2: THE NID GATE
  // Sellers can only access /seller/* if NID is APPROVED
  // ===================================================

  if (SELLER_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (profile.role !== 'SELLER') {
      // Not a seller - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (profile.nid_status !== 'APPROVED') {
      // Seller without approved NID - block access to seller routes
      return NextResponse.redirect(new URL('/seller/nid-verification', request.url));
    }
  }

  // ===================================================
  // ADMIN ROUTE PROTECTION
  // ===================================================

  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (profile.role !== 'ADMIN') {
      // Not an admin - redirect to home
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ===================================================
  // PICKUP_AGENT ROUTE PROTECTION
  // ===================================================

  if (AGENT_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (profile.role !== 'PICKUP_AGENT') {
      // Not an agent - redirect to home
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
