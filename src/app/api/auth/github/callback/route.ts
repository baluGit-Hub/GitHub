import {NextRequest, NextResponse} from 'next/server';
import {Octokit} from 'octokit';
import {cookies} from 'next/headers';
import {GITHUB_OAUTH_STATE_COOKIE, AUTH_TOKEN_COOKIE} from '@/lib/constants';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!clientId || !clientSecret || !appUrl) {
    console.error('GitHub OAuth environment variables not configured');
    return NextResponse.redirect(`${appUrl}/?error=auth_config_error`);
  }

  const storedState = cookies().get(GITHUB_OAUTH_STATE_COOKIE)?.value;
  cookies().delete(GITHUB_OAUTH_STATE_COOKIE); // Clean up state cookie

  if (!code || !state || state !== storedState) {
    console.error('Invalid state or code from GitHub callback');
    return NextResponse.redirect(`${appUrl}/?error=invalid_state`);
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: `${appUrl}/api/auth/github/callback`,
      }),
    });

    const data = await response.json();

    if (data.error || !data.access_token) {
      console.error('Error exchanging code for token:', data.error_description || data.error);
      return NextResponse.redirect(`${appUrl}/?error=${data.error || 'token_exchange_failed'}`);
    }

    const accessToken = data.access_token;

    cookies().set(AUTH_TOKEN_COOKIE, accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return NextResponse.redirect(`${appUrl}/dashboard`);
  } catch (error) {
    console.error('Error in GitHub callback:', error);
    return NextResponse.redirect(`${appUrl}/?error=callback_error`);
  }
}
