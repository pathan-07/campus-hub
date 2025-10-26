'use client';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Event, UserProfile } from '@/types';
import { sendTicketEmail } from '@/ai/flows/send-ticket-email';
import { getSupabaseClient } from './supabaseClient';

const supabase = getSupabaseClient();

type EventRow = {
  id: string;
  title: string;
  description: string;
  venue: string;
  location: string;
  date: string;
  type: Event['type'];
  category: Event['category'];
  map_link: string | null;
  registration_link: string | null;
  author_id: string;
  author_name: string | null;
  created_at: string | null;
  attendees: number;
  attendee_uids: string[] | null;
  checked_in_uids: string[] | null;
};

type UserRow = {
  id: string;
  points: number | null;
  events_attended: number | null;
};

type EventData = Omit<Event, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'attendees' | 'attendeeUids' | 'checkedInUids'>;

function mapEvent(row: EventRow): Event {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    venue: row.venue,
    location: row.location,
    date: row.date,
    type: row.type,
    category: row.category,
    mapLink: row.map_link ?? undefined,
    registrationLink: row.registration_link ?? undefined,
    authorId: row.author_id,
    authorName: row.author_name,
    createdAt: row.created_at ?? null,
    attendees: row.attendees ?? 0,
    attendeeUids: Array.isArray(row.attendee_uids) ? row.attendee_uids : [],
    checkedInUids: Array.isArray(row.checked_in_uids) ? row.checked_in_uids : [],
  };
}

async function fetchEvents(order: 'asc' | 'desc' = 'desc'): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: order === 'asc' });

  if (error) {
    console.error('Failed to load events:', error);
    throw new Error('Could not load events.');
  }

  const rows = (data ?? []) as EventRow[];
  return rows.map(mapEvent);
}

export async function addEvent(
  eventData: EventData,
  authorId: string,
  authorName?: string | null
): Promise<Event> {
  const payload = {
    title: eventData.title,
    description: eventData.description,
    venue: eventData.venue,
    location: eventData.location,
    date: eventData.date,
    type: eventData.type,
    category: eventData.category,
    map_link: eventData.mapLink ?? null,
    registration_link: eventData.registrationLink ?? null,
  author_id: authorId,
  author_name: authorName ?? null,
    attendees: 0,
    attendee_uids: [],
    checked_in_uids: [],
  };

  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select(
      'id, title, description, venue, location, date, type, category, map_link, registration_link, author_id, author_name, created_at, attendees, attendee_uids, checked_in_uids'
    )
    .single<EventRow>();

  if (error || !data) {
    console.error(
      'Error adding event in Supabase:',
      JSON.stringify(
        {
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
        },
        null,
        2
      )
    );
    throw new Error(error?.message ?? 'Could not add event.');
  }

  return mapEvent(data);
}

export function getEventsStream(callback: (events: Event[]) => void) {
  let active = true;

  const emit = async () => {
    try {
      const events = await fetchEvents('desc');
      if (active) {
        callback(events);
      }
    } catch (error) {
      console.error('Error emitting events:', error);
    }
  };

  void emit();

  const channel = supabase
    .channel('events-stream')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
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

export async function registerForEvent(eventId: string, user: UserProfile) {
  const pointsForAttending = 5;

  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single<EventRow>();

  if (eventError || !eventRow) {
    console.error('Failed to load event for registration:', eventError);
    throw new Error('Event does not exist.');
  }

  const attendeeUids = Array.isArray(eventRow.attendee_uids) ? eventRow.attendee_uids : [];

  if (attendeeUids.includes(user.uid)) {
    return;
  }

  const updatedAttendees = [...attendeeUids, user.uid];

  const { error: updateEventError } = await supabase
    .from('events')
    .update({
      attendee_uids: updatedAttendees,
      attendees: (eventRow.attendees ?? 0) + 1,
    })
    .eq('id', eventId);

  if (updateEventError) {
    console.error('Failed to update event attendees:', updateEventError);
    throw new Error('Could not register for event.');
  }

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('id, points, events_attended')
    .eq('id', user.uid)
    .single<UserRow>();

  if (userError || !userRow) {
    console.error('Failed to load user profile when registering:', userError);
    throw new Error('User profile is missing.');
  }

  const currentPoints = userRow.points ?? 0;
  const currentEvents = userRow.events_attended ?? 0;
  const newEventsAttended = currentEvents + 1;
  const newPoints = currentPoints + pointsForAttending;

  const { error: updateUserError } = await supabase
    .from('users')
    .update({
      points: newPoints,
      events_attended: newEventsAttended,
    })
    .eq('id', user.uid);

  if (updateUserError) {
    console.error('Failed to update user after registration:', updateUserError);
    throw new Error('Could not update user rewards.');
  }
}

export async function checkInUser(eventId: string, userId: string) {
  const { data: eventRow, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single<EventRow>();

  if (error || !eventRow) {
    console.error('Failed to load event for check-in:', error);
    throw new Error('Event not found.');
  }

  const attendees = Array.isArray(eventRow.attendee_uids) ? eventRow.attendee_uids : [];

  if (!attendees.includes(userId)) {
    throw new Error("This user has not RSVP'd for the event.");
  }

  const checkedIn = Array.isArray(eventRow.checked_in_uids) ? eventRow.checked_in_uids : [];

  if (checkedIn.includes(userId)) {
    throw new Error('This user has already been checked in.');
  }

  const { error: updateError } = await supabase
    .from('events')
    .update({ checked_in_uids: [...checkedIn, userId] })
    .eq('id', eventId);

  if (updateError) {
    console.error('Failed to update check-in list:', updateError);
    throw new Error('Could not check in user.');
  }
}

export async function sendTicketByEmail(
  user: UserProfile,
  event: Event,
  qrCodeDataUrl: string
) {
  if (!user.email) {
    console.warn('User does not have an email address to send ticket to.');
    return;
  }

  try {
    await sendTicketEmail({
      userEmail: user.email,
      userName: user.displayName || 'Student',
      eventName: event.title,
      qrCodeDataUrl: qrCodeDataUrl,
    });
  } catch (error) {
    console.error('Failed to trigger email sending flow:', error);
  }
}

export async function getEventById(eventId: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single<EventRow>();

  if (error) {
    console.error('Error getting event by ID:', error);
    throw new Error('Could not retrieve event data.');
  }

  return data ? mapEvent(data) : null;
}

export function getEventStreamById(eventId: string, callback: (event: Event | null) => void) {
  let active = true;

  const emit = async () => {
    try {
      const event = await getEventById(eventId);
      if (active) {
        callback(event);
      }
    } catch (error) {
      console.error(`Error reloading event ${eventId}:`, error);
    }
  };

  void emit();

  const channel = supabase
    .channel(`event-${eventId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
      (payload: RealtimePostgresChangesPayload<EventRow>) => {
        if (!active) {
          return;
        }

        if (payload.eventType === 'DELETE') {
          callback(null);
          return;
        }

        const next = payload.new ?? null;
        callback(next ? mapEvent(next) : null);
      }
    )
    .subscribe();

  return () => {
    active = false;
    void supabase.removeChannel(channel);
  };
}

export async function getEventsForUser(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .contains('attendee_uids', [userId])
    .order('date', { ascending: false });

  if (error) {
    console.error("Error fetching user's events: ", error);
    return [];
  }

  const rows = (data ?? []) as EventRow[];
  return rows.map(mapEvent);
}

export async function getEventsCreatedByUser(userId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('author_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching events created by user: ', error);
    return [];
  }

  const rows = (data ?? []) as EventRow[];
  return rows.map(mapEvent);
}

export async function getUpcomingEvents(): Promise<Event[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .gte('date', nowIso)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming events: ', error);
    return [];
  }

  const rows = (data ?? []) as EventRow[];
  return rows.map(mapEvent);
}
