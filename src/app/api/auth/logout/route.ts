import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {AUTH_TOKEN_COOKIE} from '@/lib/constants';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '/';
  cookies().delete(AUTH_TOKEN_COOKIE);
  return NextResponse.redirect(appUrl);
}
