import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic Auth for /admin and /api/admin/*
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and /api/admin/* routes
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  // Skip auth if env vars not set (development only)
  if (!adminUser || !adminPass) {
    console.warn('Admin auth disabled: ADMIN_USER or ADMIN_PASS not set');
    return NextResponse.next();
  }

  // Check Basic Auth header
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Dashboard"',
      },
    });
  }

  // Decode credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = atob(base64Credentials);
  const [user, pass] = credentials.split(':');

  // Validate credentials
  if (user !== adminUser || pass !== adminPass) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Admin Dashboard"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
