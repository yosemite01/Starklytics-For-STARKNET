import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'analyst' | 'bounty_creator' | 'admin';
  wallet_address?: string;
  email_verified: boolean;
  onboarding_completed: boolean;
  total_earnings: number;
  reputation_score: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { full_name?: string; username?: string; role?: 'analyst' | 'bounty_creator' }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer profile fetch to avoid deadlocks
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchProfile(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userData?: { full_name?: string; username?: string; role?: 'analyst' | 'bounty_creator' }) => {
    try {
      // First try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });
      
      if (signUpError && !signUpError.message.includes('already registered')) {
        throw signUpError;
      }
      
      // If user already exists or signup successful, try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        throw signInError;
      }
      
      // Create or update profile if sign in successful
      if (signInData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: signInData.user.id,
          username: userData?.username || email.split('@')[0],
          full_name: userData?.full_name || '',
          role: userData?.role || 'analyst',
          email_verified: true,
          onboarding_completed: true,
          total_earnings: 0,
          reputation_score: 0
        });
        
        if (profileError) console.warn('Profile creation warning:', profileError);
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // If user doesn't exist, create account automatically
        if (error.message.includes('Invalid login credentials')) {
          console.log('User not found, creating account...');
          return await signUp(email, password, { 
            full_name: email.split('@')[0],
            username: email.split('@')[0],
            role: 'analyst'
          });
        }
        throw error;
      }
      
      if (data.user) {
        // Ensure profile exists
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          username: data.user.email?.split('@')[0] || 'user',
          full_name: data.user.user_metadata?.full_name || '',
          role: data.user.user_metadata?.role || 'analyst',
          email_verified: true,
          onboarding_completed: true,
          total_earnings: 0,
          reputation_score: 0
        });
        
        if (profileError) console.warn('Profile upsert warning:', profileError);
        
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Sign in failed:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      setUser(null);
      setSession(null);
      setProfile(null);
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user found' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile(user.id);
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};