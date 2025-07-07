import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { app } from './firebase';
import type { Event } from '@/types';
import type { User } from 'firebase/auth';
import { generateAndSaveEventImage } from '@/ai/flows/generate-event-image';

const db = getFirestore(app);
const eventsCollection = collection(db, 'events');

type EventData = Omit<Event, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'imageUrl'>;

export async function addEvent(eventData: EventData, user: User) {
  try {
    const docRef = await addDoc(eventsCollection, {
      ...eventData,
      authorId: user.uid,
      authorName: user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
    });

    // Don't wait for the image to be generated and saved.
    // Let it run in the background.
    generateAndSaveEventImage({
      eventId: docRef.id,
      eventTitle: eventData.title,
      eventDescription: eventData.description,
    }).catch((error) => {
      console.error("Error dispatching image generation flow:", error);
    });
    
  } catch (error) {
    console.error('Error adding event to Firestore: ', error);
    throw new Error('Could not add event.');
  }
}

export function getEventsStream(callback: (events: Event[]) => void) {
  const q = query(eventsCollection, orderBy('date', 'asc'));

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
