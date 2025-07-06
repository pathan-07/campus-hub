import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { app } from './firebase';
import type { Event } from '@/types';
import type { User } from 'firebase/auth';
import { generateEventImage } from '@/ai/flows/generate-event-image-flow';

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
      imageUrl: '',
    });

    // Generate the image in the background and update the doc later.
    // This makes the UI feel fast and responsive.
    generateEventImage({ title: eventData.title, description: eventData.description })
      .then(result => {
        if (result.imageUrl) {
          const eventDoc = doc(db, 'events', docRef.id);
          updateDoc(eventDoc, { imageUrl: result.imageUrl });
        }
      })
      .catch(error => {
        console.error('Error generating or updating event image: ', error);
        // Optionally, you could update the document with an error state here.
      });

  } catch (error) {
    console.error('Error adding event: ', error);
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
