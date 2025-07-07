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
    // This is the main listener for authentication state changes.
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // If a user is authenticated, we set up a real-time listener for their profile document.
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          setLoading(true);
          if (docSnap.exists()) {
            // Profile exists, update our app state.
            const firestoreData = docSnap.data();
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firestoreData.displayName,
              photoURL: firestoreData.photoURL,
              bio: firestoreData.bio,
            });
          } else {
            // Profile doesn't exist, create it.
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
          setLoading(false);
        });
        
        // Return the profile listener's unsubscribe function to be called on cleanup.
        return () => unsubscribeProfile();
      } else {
        // No user is authenticated.
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

  const updateUserProfile = async (updates: Partial<Omit<UserProfile, 'uid' | 'email'>>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No user is signed in to update the profile.");
    
    // The single source of truth for our app's UI is Firestore.
    // We only need to update the document here. The onSnapshot listener
    // will automatically update the UI everywhere in the app.
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, updates);
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
