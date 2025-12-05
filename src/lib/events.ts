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

type EventData = Omit<Event, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'attendees' | 'attendeeUids' | 'checkedInUids'>;

type AttendeeRowWithUserDisplayName = {
  checked_in: boolean | null;
  users?: { display_name: string | null } | { display_name: string | null }[];
};

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
  const supabase = getSupabaseClient();
  const pointsForAttending = 5; // Points for RSVP-ing

  try {
    let alreadyRegistered = false;

    const { error: insertError } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: user.uid,
      });

    if (insertError) {
      if (insertError.code === '23505') {
        alreadyRegistered = true;
        console.warn('User is already registered for this event.');
      } else {
        console.error('Failed to register for event:', insertError);
        throw new Error(insertError.message);
      }
    }

    if (!alreadyRegistered) {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('points, events_attended')
        .eq('id', user.uid)
        .single();

      if (userError || !userRow) {
        console.error('Failed to load user profile when registering:', userError);
        throw new Error('User profile is missing.');
      }

      const newEventsAttended = (userRow.events_attended ?? 0) + 1;
      const newPoints = (userRow.points ?? 0) + pointsForAttending;

      const { error: updateUserError } = await supabase
        .from('users')
        .update({
          points: newPoints,
          events_attended: newEventsAttended,
        })
        .eq('id', user.uid);

      if (updateUserError) {
        console.error('Failed to update user after registration:', updateUserError);
      }
    }

    let attendeeUids: string[] | null = null;

    const { data: attendeesData, error: attendeesError } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId);

    if (!attendeesError && Array.isArray(attendeesData)) {
      attendeeUids = Array.from(
        new Set(
          attendeesData
            .map((row) => row?.user_id)
            .filter((uid): uid is string => typeof uid === 'string' && uid.length > 0)
        )
      );
    } else if (attendeesError) {
      console.error('Failed to load attendee list while syncing event:', attendeesError);
    }

    if (!attendeeUids) {
      const { data: eventRow, error: eventError } = await supabase
        .from('events')
        .select('attendee_uids')
        .eq('id', eventId)
        .single<{ attendee_uids: string[] | null }>();

      if (!eventError && eventRow) {
        const existing = Array.isArray(eventRow.attendee_uids) ? [...eventRow.attendee_uids] : [];
        if (!existing.includes(user.uid)) {
          existing.push(user.uid);
        }
        attendeeUids = existing;
      } else if (eventError) {
        console.error('Failed to fetch event while syncing attendees:', eventError);
      }
    }

    if (attendeeUids) {
      const uniqueAttendeeUids = Array.from(new Set(attendeeUids));
      const { error: syncError } = await supabase
        .from('events')
        .update({
          attendee_uids: uniqueAttendeeUids,
          attendees: uniqueAttendeeUids.length,
        })
        .eq('id', eventId);

      if (syncError) {
        console.error('Failed to sync event attendee stats:', syncError);
      }
    }
  } catch (error) {
    console.error('Error in registerForEvent:', error);
    throw error;
  }
}

/**
 * Checks in a user for an event.
 * This function updates the 'checked_in' status in the 'event_attendees' table.
 */
export async function checkInUser(
  eventId: string,
  userId: string
): Promise<{ success: true, message: string } | { success: false, message: string }> {
  const supabase = getSupabaseClient();

  // Step 1: Check if the user is actually registered for the event
  const { data: attendee, error: fetchError } = await supabase
    .from('event_attendees')
    .select('checked_in, users(display_name)') // User ka naam bhi fetch kar lete hain
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .single<AttendeeRowWithUserDisplayName>();

  if (fetchError || !attendee) {
    console.error('Check-in failed: User not registered.', fetchError);
    return { success: false, message: 'This user is not registered for the event.' };
  }

  let attendeeDisplayName: string | null | undefined = null;
  if (Array.isArray(attendee.users)) {
    attendeeDisplayName = attendee.users[0]?.display_name ?? null;
  } else if (attendee.users) {
    attendeeDisplayName = attendee.users.display_name ?? null;
  }

  // Step 2: Check if the user is already checked in
  if (attendee.checked_in) {
    return { success: false, message: `User '${attendeeDisplayName || 'N/A'}' has already been checked in.` };
  }

  // Step 3: Update the row to mark the user as checked in
  // Yeh operation RLS policy require karega (jo hum Step 2 mein add karenge)
  const { error: updateError } = await supabase
    .from('event_attendees')
    .update({ checked_in: true, checked_in_at: new Date().toISOString() })
    .eq('event_id', eventId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Failed to check in user:', updateError);
    return { success: false, message: `Check-in failed: ${updateError.message}. Are you the event author?` };
  }

  const { data: eventRow, error: eventFetchError } = await supabase
    .from('events')
    .select('checked_in_uids')
    .eq('id', eventId)
    .single<{ checked_in_uids: string[] | null }>();

  if (eventFetchError) {
    console.error('Failed to fetch event while syncing check-ins:', eventFetchError);
  } else if (eventRow) {
    const existing = Array.isArray(eventRow.checked_in_uids) ? [...eventRow.checked_in_uids] : [];
    if (!existing.includes(userId)) {
      existing.push(userId);
      const { error: syncEventError } = await supabase
        .from('events')
        .update({ checked_in_uids: existing })
        .eq('id', eventId);

      if (syncEventError) {
        console.error('Failed to sync event checked-in list:', syncEventError);
      }
    }
  }

  return { success: true, message: `Successfully checked in '${attendeeDisplayName || 'N/A'}'!` };
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

/**
 * Gets the total number of attendees/interested users for an event
 */
export async function getAttendeeCount(eventId: string): Promise<number> {
  const supabase = getSupabaseClient();

  const { count, error } = await supabase
    .from('event_attendees')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching attendee count:', error);
    return 0;
  }

  return count ?? 0;
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

/**
 * Fetches all events a user has registered for (RSVP'd).
 * It joins 'event_attendees' with 'events' to get the full details.
 */
export async function getEventsForUser(userId: string): Promise<Event[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('event_attendees')
    .select(`
      events (*)
    `)
    .eq('user_id', userId);

  if (error) {
    console.error("Error fetching user's events: ", error);
    return [];
  }

  // The result structure is like: [ { events: { ...eventData } }, ... ]
  // We need to extract the 'events' object and map it using our helper
  const events = (data ?? [])
    .map((item: any) => item.events) // Extract the nested event object
    .filter((event: any) => event !== null) // Filter out any nulls (safety check)
    .map((eventRow: any) => mapEvent(eventRow)); // Convert snake_case to camelCase

  return events;
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
