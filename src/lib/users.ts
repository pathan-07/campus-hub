import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { app } from './firebase';
import type { UserProfile } from '@/types';

const db = getFirestore(app);
const usersCollection = collection(db, 'users');

export function getUsersStream(callback: (users: UserProfile[]) => void) {
  const q = query(usersCollection, orderBy('points', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const users = querySnapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserProfile[];
      callback(users);
    },
    (error) => {
      console.error('Error getting users stream: ', error);
    }
  );

  return unsubscribe;
}
