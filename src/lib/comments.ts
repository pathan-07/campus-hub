import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import { app } from './firebase';
import type { Comment, UserProfile } from '@/types';

const db = getFirestore(app);

export function getCommentsStream(eventId: string, callback: (comments: Comment[]) => void) {
  const commentsCollection = collection(db, 'events', eventId, 'comments');
  const q = query(commentsCollection, orderBy('createdAt', 'asc'));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const comments = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      callback(comments);
    },
    (error) => {
      console.error(`Error getting comments for event ${eventId}:`, error);
    }
  );

  return unsubscribe;
}

export async function addComment(eventId: string, text: string, user: UserProfile) {
  if (!text.trim()) {
    throw new Error('Comment cannot be empty.');
  }

  const commentsCollection = collection(db, 'events', eventId, 'comments');
  try {
    await addDoc(commentsCollection, {
      text: text,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorPhotoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding comment: ', error);
    throw new Error('Failed to post comment.');
  }
}
