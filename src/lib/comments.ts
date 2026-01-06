'use client';

import type { Comment, UserProfile } from '@/types';
import { getSupabaseClient } from './supabaseClient';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const supabase = getSupabaseClient();

// This is the shape of the data we get from Supabase
// It includes the 'users' table joined in
type CommentRow = {
  id: string;
  created_at: string;
  text: string;
  author_id: string;
  event_id: string;
  users:
    | {
        display_name: string | null;
        photo_url: string | null;
      }
    | Array<{
        display_name: string | null;
        photo_url: string | null;
      }>
    | null; // users can be null if profile was deleted
};

// Helper function to map Supabase row to our app's 'Comment' type
function mapComment(row: CommentRow): Comment {
  const profile = Array.isArray(row.users) ? row.users[0] ?? null : row.users;

  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    text: row.text,
    author: {
      uid: row.author_id,
      name: profile?.display_name ?? 'Anonymous',
      photoURL: profile?.photo_url ?? null,
    },
  };
}

/**
 * Fetches all comments for a specific event, joining with user profiles.
 */
async function fetchComments(eventId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id,
      created_at,
      text,
      author_id,
      event_id,
      users ( display_name, photo_url )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return (data as CommentRow[]).map(mapComment);
}

/**
 * Sets up a real-time stream for comments on a specific event.
 * Calls the callback with the full list of comments whenever they change.
 * Returns an unsubscribe function.
 */
export function getCommentsStream(
  eventId: string,
  callback: (comments: Comment[]) => void
) {
  let active = true;

  const emit = async () => {
    try {
      const comments = await fetchComments(eventId);
      if (active) {
        callback(comments);
      }
    } catch (error) {
      console.error('Error emitting comments:', error);
    }
  };

  // Fetch initial comments
  void emit();

  // Set up real-time subscription
  const channel = supabase
    .channel(`comments-${eventId}`)
    .on<RealtimePostgresChangesPayload<CommentRow>>(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'comments',
        filter: `event_id=eq.${eventId}`, // Only get changes for this event
      },
      () => {
        // When a change happens, refetch all comments
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
 * Adds a new comment to an event.
 */
export async function addComment(
  eventId: string,
  text: string,
  author: UserProfile
): Promise<Comment> {
  if (!author) {
    throw new Error('User must be logged in to comment.');
  }

  const newComment = {
    event_id: eventId,
    text: text,
    author_id: author.uid,
  };

  const { data, error } = await supabase
    .from('comments')
    .insert(newComment)
    .select()
    .single();

  if (error) {
    console.error(
      'Error adding comment in Supabase:',
      JSON.stringify(error, null, 2)
    );
    throw error;
  }

  // Return the new comment, manually adding author profile
  // (The stream will update this later with the proper join)
  return {
    id: data.id,
    createdAt: new Date(data.created_at),
    text: data.text,
    author: {
      uid: author.uid,
      name: author.displayName ?? 'You',
      photoURL: author.photoURL ?? null,
    },
  };
}
