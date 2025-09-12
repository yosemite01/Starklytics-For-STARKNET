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
    // DEMO MODE - Check for stored demo session
    const demoUser = localStorage.getItem('demo_user');
    const demoProfile = localStorage.getItem('demo_profile');
    
    if (demoUser && demoProfile) {
      setUser(JSON.parse(demoUser));
      setProfile(JSON.parse(demoProfile));
    }
    
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userData?: { full_name?: string; username?: string; role?: 'analyst' | 'bounty_creator' }) => {
    // DEMO MODE - Instant login without real authentication
    try {
      const demoUser = {
        id: `demo-${Date.now()}`,
        email,
        user_metadata: userData
      };
      
      const demoProfile = {
        id: demoUser.id,
        username: userData?.username || email.split('@')[0],
        full_name: userData?.full_name || '',
        role: userData?.role || 'analyst',
        email_verified: true,
        onboarding_completed: true,
        total_earnings: 0,
        reputation_score: 0
      };
      
      // Store demo session
      localStorage.setItem('demo_user', JSON.stringify(demoUser));
      localStorage.setItem('demo_profile', JSON.stringify(demoProfile));
      
      // Set state
      setUser(demoUser as any);
      setProfile(demoProfile);
      
      // Redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // DEMO MODE - Instant login
    return await signUp(email, password, {
      full_name: email.split('@')[0],
      username: email.split('@')[0],
      role: 'analyst'
    });
  };

  const signOut = async () => {
    // DEMO MODE - Clear demo session
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_profile');
    setUser(null);
    setSession(null);
    setProfile(null);
    window.location.href = '/auth';
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