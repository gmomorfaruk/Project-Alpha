import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  const adminSecret = process.env.ADMIN_SECRET_PATH || 'admin-secret-xyz';
  const adminSubdomain = process.env.ADMIN_SUBDOMAIN;

  // 1. Subdomain-based check
  if (adminSubdomain) {
    // Check if the hostname matches the configured subdomain
    // We clean port numbers (e.g. localhost:3000 -> localhost)
    const hostWithoutPort = hostname.split(':')[0];
    const targetHostWithoutPort = adminSubdomain.split(':')[0];
    const isSubdomain = hostWithoutPort === targetHostWithoutPort;

    // Block any direct attempts to access '/admin' or its subroutes
    // unless accessed via the approved subdomain
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      if (!isSubdomain) {
        return NextResponse.rewrite(new URL('/404', request.url));
      }
    }
  } else {
    // 2. Secret path check (fallback)
    // Block direct access to '/admin' or its subroutes on all hosts
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return NextResponse.rewrite(new URL('/404', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply proxy to all routes except static assets, media, and API endpoints
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};
