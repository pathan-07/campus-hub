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
    // Add the event document first to get its ID
    const docRef = await addDoc(eventsCollection, {
      ...eventData,
      authorId: user.uid,
      authorName: user.email?.split('@')[0] || 'Anonymous',
      createdAt: serverTimestamp(),
    });

    // Asynchronously generate and update the image
    generateEventImage({ title: eventData.title, description: eventData.description })
      .then(result => {
        // Update the document with the generated image URL
        updateDoc(doc(db, 'events', docRef.id), { imageUrl: result.imageUrl });
      })
      .catch(error => {
        // Log the error but don't block the user. The event is already posted.
        console.error(`Image generation failed for event "${eventData.title}" (ID: ${docRef.id}). Reason:`, error);
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
