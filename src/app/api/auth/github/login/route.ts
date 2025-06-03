import {NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {GITHUB_OAUTH_STATE_COOKIE} from '@/lib/constants';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !appUrl) {
    console.error('GitHub Client ID or App URL not configured');
    return NextResponse.json({error: 'Server configuration error'}, {status: 500});
  }

  const state = Math.random().toString(36).substring(7);
  const redirectUri = `${appUrl}/api/auth/github/callback`;

  cookies().set(GITHUB_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user%20repo&state=${state}`;

  return NextResponse.redirect(githubAuthUrl);
}
