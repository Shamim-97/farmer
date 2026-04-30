import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient as createSsrServerClient } from '@supabase/ssr';
import {
  SELLER_ONLY_ROUTES,
  ADMIN_ONLY_ROUTES,
  AGENT_ONLY_ROUTES,
  PUBLIC_ROUTES,
} from '@/lib/constants/routes';

/**
 * Proxy (Next 16) — formerly middleware.ts.
 *
 * Responsibilities:
 *  - Refresh the Supabase session and rewrite cookies on the response.
 *  - Role-based route protection.
 *  - 10 PM Bangladesh-time order cutoff.
 *  - NID gate for /seller/*.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exact match for '/'. Prefix match for everything else
  // (otherwise '/' would match every path).
  const isPublic = PUBLIC_ROUTES.some((route) =>
    route === '/' ? pathname === '/' : pathname.startsWith(route)
  );
  if (isPublic) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Fail closed: if env is missing or looks like a placeholder, deny.
  if (!url || !anon || url.includes('xxxx')) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  let user: { id: string } | null = null;
  let profile: { id: string; role: string; nid_status: string } | null = null;

  try {
    const supabase = createSsrServerClient(url, anon, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(toSet) {
          for (const { name, value } of toSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of toSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const userResult = await supabase.auth.getUser();
    user = userResult.data.user as { id: string } | null;

    if (!user) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }

    const profileResult = await supabase
      .from('profiles')
      .select('id, role, nid_status')
      .eq('id', user.id)
      .single();

    if (profileResult.error || !profileResult.data) {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    profile = profileResult.data as { id: string; role: string; nid_status: string };
  } catch {
    // Supabase unreachable, network error, etc. — deny.
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  // 10 PM Bangladesh-time order cutoff.
  if (pathname === '/checkout' || pathname.startsWith('/cart')) {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const [hour, minute] = formatter.format(new Date()).split(':').map(Number);
    if (hour * 60 + minute >= 22 * 60) {
      response.headers.set('x-order-blocked', 'true');
      response.headers.set('x-block-reason', '10-pm-lock');
      return response;
    }
  }

  // Seller routes require APPROVED NID.
  if (SELLER_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (profile.role !== 'SELLER') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (profile.nid_status !== 'APPROVED' && pathname !== '/seller/nid-verification') {
      return NextResponse.redirect(new URL('/seller/nid-verification', request.url));
    }
  }

  if (ADMIN_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (profile.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (AGENT_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    if (profile.role !== 'PICKUP_AGENT') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public|.*\\.).*)'],
};
