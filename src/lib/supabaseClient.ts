'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const createClient = () => createClientComponentClient<any>();

type SupabaseClientType = ReturnType<typeof createClient>;

let cachedClient: SupabaseClientType | null = null;

export function getSupabaseClient(): SupabaseClientType {
  if (!cachedClient) {
    cachedClient = createClient();
  }

  return cachedClient;
}
