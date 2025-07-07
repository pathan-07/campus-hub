'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateAuthProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: { displayName: string; bio: string; photoFile?: File | null }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          setLoading(true);
          if (docSnap.exists()) {
            const firestoreData = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firestoreData.displayName,
              photoURL: firestoreData.photoURL,
              bio: firestoreData.bio,
              points: firestoreData.points || 0,
              badges: firestoreData.badges || [],
              eventsAttended: firestoreData.eventsAttended || 0,
            });
          } else {
            const profileData = {
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
              photoURL: firebaseUser.photoURL || null,
              bio: '',
              points: 0,
              badges: [],
              eventsAttended: 0,
            };
            await setDoc(userRef, profileData);
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              ...profileData,
            });
          }
          setLoading(false);
        });
        
        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = (email: string, pass: string) => {
    return createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const updateUserProfile = async (updates: { displayName: string; bio: string; photoFile?: File | null }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user is signed in to update the profile.");

    let newPhotoURL = user?.photoURL || null;

    if (updates.photoFile) {
        const filePath = `profile-pictures/${currentUser.uid}`;
        const storageRef = ref(storage, filePath);
        const snapshot = await uploadBytes(storageRef, updates.photoFile);
        newPhotoURL = await getDownloadURL(snapshot.ref);
    }
    
    // Update Firebase Auth profile
    await updateAuthProfile(currentUser, {
        displayName: updates.displayName,
        photoURL: newPhotoURL ?? undefined,
    });

    // Update Firestore document
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
        displayName: updates.displayName,
        bio: updates.bio,
        photoURL: newPhotoURL,
    });
  };

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
