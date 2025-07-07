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

const db = getFirestore(app);
const eventsCollection = collection(db, 'events');

type EventData = Omit<Event, 'id' | 'authorId' | 'authorName' | 'createdAt' | 'imageUrl'>;

export async function addEvent(eventData: EventData, user: User) {
  try {
    await addDoc(eventsCollection, {
      ...eventData,
      authorId: user.uid,
      authorName: user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
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
