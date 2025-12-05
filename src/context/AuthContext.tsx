
'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  createClientComponentClient,
  type Session,
  type User,
} from '@supabase/auth-helpers-nextjs';
import type { AuthChangeEvent } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  authUser: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: { displayName: string; bio: string; photoFile?: File | null }) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  authUser: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  signInWithGoogle: async () => {},
  refreshProfile: async () => {},
});

type RawUserRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  photo_url: string | null;
  bio: string | null;
  points: number | null;
  events_attended: number | null;
  badges: string[] | null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    return createClientComponentClient({
      supabaseUrl,
      supabaseKey: supabaseAnonKey,
    });
  }, []);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const toUserProfile = useCallback((row: RawUserRow, fallbackUser: User | null): UserProfile => ({
    uid: row.id,
    email: row.email ?? fallbackUser?.email ?? null,
    displayName: row.display_name ?? fallbackUser?.user_metadata?.display_name ?? fallbackUser?.email ?? null,
    photoURL: row.photo_url ?? (fallbackUser?.user_metadata?.avatar_url as string | undefined) ?? null,
    bio: row.bio ?? undefined,
    points: row.points ?? 0,
    badges: row.badges ?? [],
    eventsAttended: row.events_attended ?? 0,
  }), []);

  const ensureProfileRow = useCallback(
    async (targetUser: User): Promise<RawUserRow | null> => {
      const { data: existingProfile, error: selectError } = await supabase
        .from('users')
        .select(
          'id, email, display_name, photo_url, bio, points, events_attended, badges'
        )
        .eq('id', targetUser.id)
        .maybeSingle<RawUserRow>();

      if (selectError) {
        console.error('Error fetching user profile:', selectError);
        throw selectError;
      }

      return existingProfile ?? null;
    },
    [supabase]
  );

  const loadProfile = useCallback(
    async (targetUser: User | null) => {
      if (!targetUser) {
        setUser(null);
        return;
      }

      let attempt = 0;
      const maxAttempts = 3;
      const delayMs = 500;

      while (attempt < maxAttempts) {
        attempt += 1;
        console.log(`Loading profile attempt ${attempt} for user ${targetUser.id}`);

        try {
          const profileRow = await ensureProfileRow(targetUser);

          if (profileRow) {
            setUser(toUserProfile(profileRow, targetUser));
            console.log(`Profile loaded successfully on attempt ${attempt}`);
            return;
          }

          if (attempt < maxAttempts) {
            console.log(`Profile not found on attempt ${attempt}, retrying in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }

          console.error(`Profile row for user ${targetUser.id} not found after ${maxAttempts} attempts. Trigger might have failed. Signing the user out to force re-authentication.`);

          try {
            await supabase.auth.signOut();
          } catch (signOutError) {
            console.error('Failed to sign out after missing profile row:', signOutError);
          }

          setSession(null);
          setAuthUser(null);
          setUser(null);
          return;
        } catch (profileError) {
          console.error(`Failed to load user profile on attempt ${attempt}:`, profileError);
          return;
        }
      }
    },
    [ensureProfileRow, toUserProfile]
  );

  const initializeAuthState = useCallback(async () => {
    setLoading(true);
    const {
      data: { session: initialSession },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Failed to retrieve Supabase session:', error);
      setSession(null);
      setAuthUser(null);
      setUser(null);
      setLoading(false);
      return;
    }

    setSession(initialSession);
    setAuthUser(initialSession?.user ?? null);
    await loadProfile(initialSession?.user ?? null);
    setLoading(false);
  }, [supabase, loadProfile]);

  useEffect(() => {
    void initializeAuthState();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: AuthChangeEvent, nextSession: Session | null) => {
      setLoading(true);
      setSession(nextSession);
      setAuthUser(nextSession?.user ?? null);
      await loadProfile(nextSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadProfile, initializeAuthState]);

  const login = useCallback(
    async (email: string, pass: string) => {
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setSession(data.session);
          setAuthUser(data.session.user);
          await loadProfile(data.session.user);
        }
      } finally {
        setLoading(false);
      }
    },
    [supabase, loadProfile]
  );

  const signup = useCallback(
    async (email: string, pass: string) => {
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
        });

        if (error) {
          throw error;
        }

        if (data.session) {
          setSession(data.session);
          setAuthUser(data.session.user);
          await loadProfile(data.session.user);
          return;
        }

        if (data.user) {
          setAuthUser(data.user);
          await loadProfile(data.user);
        }
      } finally {
        setLoading(false);
      }
    },
    [supabase, loadProfile]
  );

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }

    setSession(null);
    setAuthUser(null);
    setUser(null);
    router.push('/login');
  }, [supabase, router]);

  const signInWithGoogle = useCallback(async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: origin
        ? {
            redirectTo: `${origin}/auth/callback`,
          }
        : undefined,
    });

    if (error) {
      throw error;
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    await loadProfile(authUser);
  }, [authUser, loadProfile]);

  const updateUserProfile = useCallback(
    async (updates: { displayName: string; bio: string; photoFile?: File | null }) => {
      if (!authUser) {
        throw new Error('No user is signed in to update the profile.');
      }

      setLoading(true);
      let nextPhotoUrl = user?.photoURL ?? null;

      try {
        if (updates.photoFile) {
          const fileExtension = updates.photoFile.name.split('.').pop();
          const safeExtension = fileExtension ? `.${fileExtension}` : '';
          const timestamp = Date.now();
          const filePath = `${authUser.id}/${timestamp}${safeExtension}`;

          const { error: uploadError } = await supabase.storage
            .from('profile-pictures')
            .upload(filePath, updates.photoFile, {
              cacheControl: '3600',
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: publicUrlData } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(filePath);

          nextPhotoUrl = publicUrlData?.publicUrl ?? nextPhotoUrl;
        }

        const { error: profileUpdateError } = await supabase
          .from('users')
          .update({
            display_name: updates.displayName,
            bio: updates.bio,
            photo_url: nextPhotoUrl,
          })
          .eq('id', authUser.id);

        if (profileUpdateError) {
          throw profileUpdateError;
        }

        await refreshProfile();
      } finally {
        setLoading(false);
      }
    },
    [authUser, supabase, refreshProfile, user?.photoURL]
  );

  const value: AuthContextType = {
    user,
    session,
    authUser,
    loading,
    login,
    signup,
    logout,
    updateUserProfile,
    signInWithGoogle,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
