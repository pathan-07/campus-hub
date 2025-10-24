'use client';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Comment, UserProfile } from '@/types';
import { getSupabaseClient } from './supabaseClient';

const supabase = getSupabaseClient();

type CommentRow = {
  id: string;
  event_id: string;
  text: string;
  author_id: string;
  author_name: string;
  author_photo_url: string | null;
  created_at: string;
};

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    text: row.text,
    authorId: row.author_id,
    authorName: row.author_name,
    authorPhotoURL: row.author_photo_url,
    createdAt: row.created_at,
  };
}

export function getCommentsStream(eventId: string, callback: (comments: Comment[]) => void) {
  let active = true;

  const emit = async () => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`Error getting comments for event ${eventId}:`, error);
      return;
    }

    if (active) {
      const rows = (data ?? []) as CommentRow[];
      callback(rows.map(mapComment));
    }
  };

  void emit();

  const channel = supabase
    .channel(`comments-${eventId}`)
    .on<RealtimePostgresChangesPayload<CommentRow>>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'comments', filter: `event_id=eq.${eventId}` },
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

export async function addComment(eventId: string, text: string, user: UserProfile) {
  if (!text.trim()) {
    throw new Error('Comment cannot be empty.');
  }

  const payload = {
    event_id: eventId,
    text,
    author_id: user.uid,
    author_name: user.displayName || 'Anonymous',
    author_photo_url: user.photoURL ?? null,
  };

  const { error } = await supabase.from('comments').insert(payload);

  if (error) {
    console.error('Error adding comment: ', error);
    throw new Error('Failed to post comment.');
  }
}
