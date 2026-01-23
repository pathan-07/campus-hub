import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies as nextCookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({
      cookies: nextCookies,
    });

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Supabase auth callback failed to exchange code for session', error);
    }
  }

  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto');

  const redirectUrl = new URL('/', requestUrl);

  if (forwardedHost) {
    redirectUrl.host = forwardedHost.split(',')[0].trim();
  }

  if (forwardedProto) {
    redirectUrl.protocol = `${forwardedProto.split(',')[0].trim()}:`;
  }

  return NextResponse.redirect(redirectUrl);
}
