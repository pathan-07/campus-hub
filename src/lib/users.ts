
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
export function getUsersStream(
  callback: (users: UserProfile[]) => void,
  onError?: (error: unknown) => void
) {
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
      if (active) {
        onError?.(error);
      }
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

export type Participant = {
  profile: UserProfile;
  checkedIn: boolean;
  checkedInAt: string | null;
  registeredAt: string | null;
};

/**
 * Fetches all participants for a specific event, joining with their profiles.
 * This queries the 'event_attendees' table.
 */
export async function getParticipantsForEvent(eventId: string): Promise<Participant[]> {
  const supabase = getSupabaseClient();

  // Join event_attendees with the users table
  const { data, error } = await supabase
    .from('event_attendees')
    .select(`
      checked_in,
      checked_in_at,
      users (
        id,
        display_name,
        email,
        photo_url,
        bio,
        points,
        events_attended
      )
    `)
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching participants:', error);
    throw new Error(error.message);
  }

  if (!data) return [];

  // Map to our Participant type
  return data.map((row: any) => {
    const user = row.users;
    // Safety check if user profile is missing
    if (!user) return null;

    return {
      checkedIn: row.checked_in ?? false,
      checkedInAt: row.checked_in_at ?? null,
      registeredAt: null,
      profile: {
        uid: user.id,
        email: user.email,
        displayName: user.display_name,
        photoURL: user.photo_url,
        bio: user.bio,
        points: user.points,
        eventsAttended: user.events_attended,
        badges: [], // We can leave this empty for the list view
      } as UserProfile,
    };
  }).filter(Boolean) as Participant[];
}
