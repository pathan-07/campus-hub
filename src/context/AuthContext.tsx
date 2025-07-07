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
} from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';

const auth = getAuth(app);
const db = getFirestore(app);

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass:string) => Promise<any>;
  signup: (email: string, pass: string) => Promise<any>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Omit<UserProfile, 'uid' | 'email'>>) => Promise<void>;
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const firestoreData = userSnap.data();
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firestoreData.displayName,
            photoURL: firestoreData.photoURL,
            bio: firestoreData.bio,
          });
        } else {
          // New user or user from an old system, create their profile document
          const profileData = {
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous',
            photoURL: firebaseUser.photoURL || null,
            bio: '',
          };
          await setDoc(userRef, profileData);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            ...profileData,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string) => {
    // We rely on the onAuthStateChanged listener to create the profile document in Firestore.
    // This ensures a profile is created for any new user, regardless of sign-up method.
    return await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'uid' | 'email'>>) => {
    if (!user) throw new Error("No user is signed in to update the profile.");
    
    // 1. Update Firebase Auth for properties it supports (displayName, photoURL)
    if (auth.currentUser) {
      await updateAuthProfile(auth.currentUser, {
        displayName: updates.displayName,
        photoURL: updates.photoURL,
      });
    }

    // 2. Update the complete profile in our Firestore document
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, updates);

    // 3. Optimistically update local state to make the UI feel instant
    setUser(prevUser => ({ ...prevUser!, ...updates }));
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
