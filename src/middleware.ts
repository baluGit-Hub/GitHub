import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import {AUTH_TOKEN_COOKIE} from '@/lib/constants';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_TOKEN_COOKIE)?.value;
  const {pathname} = request.nextUrl;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL('/', request.url).toString();


  if (pathname.startsWith('/dashboard')) {
    if (!authToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (pathname === '/') {
    if (authToken) {
      // If user is on login page but already authenticated, redirect to dashboard
      // This check can be more sophisticated, e.g. validating token before redirecting
      try {
        // A light check could be to see if token exists
        // A full check would involve validating the token with GitHub API but that's heavy for middleware
        // For now, just checking existence is okay for this app's scope
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (error) {
        // If token is invalid, clear it and let user stay on login page
        const response = NextResponse.next();
        response.cookies.delete(AUTH_TOKEN_COOKIE);
        return response;
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/'],
};
