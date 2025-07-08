
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs,
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

export async function getUsersByUIDs(uids: string[]): Promise<UserProfile[]> {
  if (!uids || uids.length === 0) {
    return [];
  }

  const CHUNK_SIZE = 30;
  const chunks: string[][] = [];
  for (let i = 0; i < uids.length; i += CHUNK_SIZE) {
    chunks.push(uids.slice(i, i + CHUNK_SIZE));
  }
  
  try {
    const userPromises = chunks.map(chunk => {
      const q = query(usersCollection, where('__name__', 'in', chunk));
      return getDocs(q);
    });

    const querySnapshots = await Promise.all(userPromises);
    
    const users: UserProfile[] = [];
    querySnapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
    });

    const userMap = new Map(users.map(u => [u.uid, u]));
    return uids.map(uid => userMap.get(uid)).filter(Boolean) as UserProfile[];

  } catch (error) {
    console.error("Error getting users by UIDs: ", error);
    throw new Error('Could not retrieve user profiles.');
  }
}
