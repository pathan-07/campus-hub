import { NextResponse } from 'next/server';
import { cookies as nextCookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function POST() {
  const guestEmail = process.env.GUEST_EMAIL ?? process.env.NEXT_PUBLIC_GUEST_EMAIL;
  const guestPassword = process.env.GUEST_PASSWORD ?? process.env.NEXT_PUBLIC_GUEST_PASSWORD;

  if (!guestEmail || !guestPassword) {
    return NextResponse.json(
      { message: 'Guest login is not configured.' },
      { status: 501 }
    );
  }

  const cookieStore = await nextCookies();
  const supabase = createRouteHandlerClient({
    cookies: async () => cookieStore,
  });

  const { error } = await supabase.auth.signInWithPassword({
    email: guestEmail,
    password: guestPassword,
  });

  if (error) {
    return NextResponse.json(
      { message: error.message },
      { status: 401 }
    );
  }

  return NextResponse.json({ success: true });
}
