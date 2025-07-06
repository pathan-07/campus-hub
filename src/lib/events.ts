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
import { app, storage } from './firebase';
import type { Event } from '@/types';
import type { User } from 'firebase/auth';
import { generateEventImage } from '@/ai/flows/generate-event-image-flow';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

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

    // Asynchronously generate image, upload to Storage, and update Firestore
    generateEventImage({ title: eventData.title, description: eventData.description })
      .then(async (result) => {
        try {
          const storageRef = ref(storage, `events/${docRef.id}.png`);
          const base64Data = result.imageUrl.split(',')[1];
          const uploadResult = await uploadString(storageRef, base64Data, 'base64', {
            contentType: 'image/png'
          });
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          
          await updateDoc(doc(db, 'events', docRef.id), { imageUrl: downloadUrl });
        } catch (storageError) {
          console.error(`Failed to upload generated image to Storage for event ${docRef.id}. Reason:`, storageError);
        }
      })
      .catch(error => {
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
