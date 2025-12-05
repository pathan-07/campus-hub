
'use client';

import type { UserProfile } from '@/types';
import { getSupabaseClient } from './supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// Define the shape of the database row
type UserRow = {
  id: string; // Supabase uses 'id', our type uses 'uid'
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  bio: string | null;
  points: number | null;
  events_attended: number | null;
  // Note: badges are in a separate table
};

// Helper function to map Supabase row (snake_case) to our app's UserProfile (camelCase)
function mapUserProfile(row: UserRow): UserProfile {
  return {
    uid: row.id,
    email: row.email ?? null,
    displayName: row.display_name ?? 'Anonymous',
    photoURL: row.photo_url ?? null,
    bio: row.bio ?? undefined,
    points: row.points ?? 0,
    eventsAttended: row.events_attended ?? 0,
    badges: [], // Badges need a separate query, we'll leave it empty for the leaderboard
  };
}

/**
 * Fetches all users, ordered by points.
 */
async function fetchAllUsersOrderedByPoints(): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('points', { ascending: false }); // Order by points

  if (error) {
    console.error('Error fetching users:', error);
    throw error;
  }

  return data.map(mapUserProfile);
}

/**
 * Sets up a real-time stream for the leaderboard.
 * Calls the callback with the full list of users (ordered by points) whenever they change.
 * Returns an unsubscribe function.
 */
export function getUsersStream(callback: (users: UserProfile[]) => void) {
  let active = true;
  const supabase = getSupabaseClient();

  const emit = async () => {
    try {
      const users = await fetchAllUsersOrderedByPoints();
      if (active) {
        callback(users);
      }
    } catch (error) {
      console.error('Error emitting user list:', error);
    }
  };

  // Fetch initial list
  void emit();

  // Set up real-time subscription
  const channel = supabase
    .channel('public-users-leaderboard')
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'users', // On the 'users' table
      },
      (payload: RealtimePostgresChangesPayload<UserRow>) => {
        // When a change happens, refetch all users
        void emit();
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

/**
 * Fetches multiple user profiles from a list of UIDs.
 * (This replaces your old getUsersByUIDs)
 */
export async function getUsersByUIDs(uids: string[]): Promise<UserProfile[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', uids); // 'in' is the SQL equivalent of 'array-contains-any'

  if (error) {
    console.error('Error fetching users by UIDs:', error);
    throw error;
  }

  return data.map(mapUserProfile);
}
