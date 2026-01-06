import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies as nextCookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const cookieStore = await nextCookies();
    const supabase = createRouteHandlerClient({
      // Avoid calling next/headers cookies() inside the helper in Next 15.
      // Resolve it once and hand back the store.
      cookies: async () => cookieStore,
    });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(requestUrl.origin);
}
