
'use client';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { UserProfile } from '@/types';
import { getSupabaseClient } from './supabaseClient';

const supabase = getSupabaseClient();

type UserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  bio: string | null;
  points: number | null;
  events_attended: number | null;
};

function mapUser(row: UserRow): UserProfile {
  return {
    uid: row.id,
    email: row.email,
    displayName: row.display_name,
    photoURL: row.photo_url,
    bio: row.bio ?? undefined,
    points: row.points ?? 0,
    badges: [],
    eventsAttended: row.events_attended ?? 0,
  };
}

export function getUsersStream(callback: (users: UserProfile[]) => void) {
  let active = true;

  const emit = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name, photo_url, bio, points, events_attended')
      .order('points', { ascending: false });

    if (error) {
      console.error('Error getting users stream: ', error);
      return;
    }

    if (active) {
      const rows = (data ?? []) as UserRow[];
      callback(rows.map(mapUser));
    }
  };

  void emit();

  const channel = supabase
    .channel('users-stream')
    .on<RealtimePostgresChangesPayload<UserRow>>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users' },
      () => {
        void emit();
      }
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function getUsersByUIDs(uids: string[]): Promise<UserProfile[]> {
  if (!uids || uids.length === 0) {
    return [];
  }

  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += CHUNK_SIZE) {
    chunks.push(uids.slice(i, i + CHUNK_SIZE));
  }

  try {
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, display_name, photo_url, bio, points, events_attended')
          .in('id', chunk);

        if (error) {
          throw error;
        }

  const rows = (data ?? []) as UserRow[];
  return rows.map(mapUser);
      })
    );

    const flat = results.flat();
    const userMap = new Map(flat.map((user) => [user.uid, user]));
    return uids.map((uid) => userMap.get(uid)).filter(Boolean) as UserProfile[];
  } catch (error) {
    console.error('Error getting users by UIDs: ', error);
    throw new Error('Could not retrieve user profiles.');
  }
}
