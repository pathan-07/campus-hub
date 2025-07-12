
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  runTransaction,
  doc,
  arrayUnion,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { app } from './firebase';
import type { Event, UserProfile } from '@/types';
import { sendTicketEmail } from '@/ai/flows/send-ticket-email';
import { generateEventImage } from '@/ai/flows/generate-event-image';

const db = getFirestore(app);
const eventsCollection = collection(db, 'events');

type EventData = Omit<Event, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'attendees' | 'attendeeUids' | 'checkedInUids' | 'imageUrl'>;

export async function addEvent(eventData: EventData, user: UserProfile) {
  try {
    const imageUrl = await generateEventImage({
      title: eventData.title,
      description: eventData.description,
    });
    
    await addDoc(eventsCollection, {
      ...eventData,
      authorId: user.uid,
      authorName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
      attendees: 0,
      attendeeUids: [],
      checkedInUids: [],
      imageUrl: imageUrl ?? null,
    });
  } catch (error) {
    console.error('Error adding event to Firestore: ', error);
    throw new Error('Could not add event.');
  }
}

export function getEventsStream(callback: (events: Event[]) => void) {
  const q = query(eventsCollection, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const events = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Event[];
      callback(events);
    },
    (error) => {
      console.error('Error getting events stream: ', error);
    }
  );

  return unsubscribe;
}

export async function registerForEvent(eventId: string, user: UserProfile) {
  const eventRef = doc(db, 'events', eventId);
  const userRef = doc(db, 'users', user.uid);
  const pointsForAttending = 5;

  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      const userDoc = await transaction.get(userRef);

      if (!eventDoc.exists()) {
        throw new Error("Event does not exist!");
      }
      if (!userDoc.exists()) {
        throw new Error("User does not exist!");
      }

      const eventData = eventDoc.data();
      const userData = userDoc.data();

      if (eventData.attendeeUids.includes(user.uid)) {
        return;
      }

      const newAttendeeUids = [...eventData.attendeeUids, user.uid];
      const newAttendeesCount = eventData.attendees + 1;
      
      const newPoints = (userData.points || 0) + pointsForAttending;
      const newEventsAttended = (userData.eventsAttended || 0) + 1;
      const newBadges = [...userData.badges];

      if (newEventsAttended === 1 && !newBadges.includes('First RSVP')) {
        newBadges.push('First RSVP');
      }
      if (newEventsAttended === 5 && !newBadges.includes('Socialite')) {
        newBadges.push('Socialite');
      }

      transaction.update(eventRef, { 
        attendeeUids: newAttendeeUids,
        attendees: newAttendeesCount,
      });

      transaction.update(userRef, {
        points: newPoints,
        eventsAttended: newEventsAttended,
        badges: newBadges,
      });
    });
  } catch (error) {
    console.error("Error registering for event: ", error);
    throw error;
  }
}

export async function checkInUser(eventId: string, userId: string) {
  const eventRef = doc(db, 'events', eventId);
  try {
    await runTransaction(db, async (transaction) => {
      const eventDoc = await transaction.get(eventRef);
      if (!eventDoc.exists()) {
        throw new Error('Event not found!');
      }

      const eventData = eventDoc.data();

      if (!eventData.attendeeUids?.includes(userId)) {
        throw new Error('This user has not RSVP\'d for the event.');
      }
      
      if (eventData.checkedInUids?.includes(userId)) {
         throw new Error('This user has already been checked in.');
      }

      transaction.update(eventRef, {
        checkedInUids: arrayUnion(userId)
      });
    });
  } catch (error) {
    console.error("Error checking in user: ", error);
    throw error;
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
  const eventRef = doc(db, 'events', eventId);
  try {
    const docSnap = await getDoc(eventRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Event;
    }
    return null;
  } catch (error) {
    console.error('Error getting event by ID:', error);
    throw new Error('Could not retrieve event data.');
  }
}

export function getEventStreamById(eventId: string, callback: (event: Event | null) => void) {
  const eventRef = doc(db, 'events', eventId);

  const unsubscribe = onSnapshot(
    eventRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Event);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error(`Error getting real-time event data for ${eventId}:`, error);
      callback(null);
    }
  );

  return unsubscribe;
}
