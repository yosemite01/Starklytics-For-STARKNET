import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'creator' | 'analyst';
  isActive: boolean;
  lastLogin?: Date;
}

interface Profile extends User {
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, userData?: { firstName?: string; lastName?: string; role?: 'analyst' | 'creator' }) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: (token: string, role?: 'analyst' | 'creator') => Promise<{ error: any }>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoAuth = true; // Only authentication is demo, everything else is production

  const fetchProfile = async () => {
    try {
      if (isDemoAuth) {
        const storedUser = localStorage.getItem('demo_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser) as User;
          setUser(userData);
          setProfile({ ...userData, fullName: `${userData.firstName || ''} ${userData.lastName || ''}` });
        }
      } else {
        const response = await apiClient.get('/api/profile');
        if (response && typeof response === 'object' && 'data' in response) {
          const userData = (response.data as User);
          setUser(userData);
          setProfile({ 
            ...userData, 
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}` 
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('auth_token');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await fetchProfile();
        }
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem('auth_token');
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, userData?: { firstName?: string; lastName?: string; role?: 'analyst' | 'creator' }) => {
    try {
      const newUser: User = {
        _id: Date.now().toString(),
        email,
        firstName: userData?.firstName || 'Demo',
        lastName: userData?.lastName || 'User',
        role: userData?.role === 'creator' ? 'creator' : 'analyst',
        isActive: true,
        lastLogin: new Date()
      };

      const token = `demo_token_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('demo_user', JSON.stringify(newUser));

      setUser(newUser);
      setProfile({ ...newUser, fullName: `${newUser.firstName} ${newUser.lastName}` });
      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error.message || 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const demoUser: User = {
        _id: 'demo_user_123',
        email,
        firstName: 'Demo',
        lastName: 'User',
        role: email.includes('creator') ? 'creator' : 'analyst',
        isActive: true,
        lastLogin: new Date()
      };

      const token = `demo_token_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('demo_user', JSON.stringify(demoUser));

      setUser(demoUser);
      setProfile({ ...demoUser, fullName: `${demoUser.firstName} ${demoUser.lastName}` });
      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || 'Login failed' };
    }
  };

  const signInWithGoogle = async (token: string, role: 'analyst' | 'creator' = 'analyst') => {
    try {
      const demoUser: User = {
        _id: 'google_demo_user',
        email: 'google_demo@starklytics.com',
        firstName: 'Google',
        lastName: 'Demo',
        role: 'analyst',
        isActive: true,
        lastLogin: new Date()
      };

      const demoToken = `google_demo_token_${Date.now()}`;
      localStorage.setItem('auth_token', demoToken);
      localStorage.setItem('demo_user', JSON.stringify(demoUser));

      setUser(demoUser);
      setProfile({ ...demoUser, fullName: `${demoUser.firstName} ${demoUser.lastName}` });
      return { error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { error: error.message || 'Google authentication failed' };
    }
  };

  const signOut = async () => {
    apiClient.clearToken();
    setUser(null);
    setProfile(null);
    window.location.href = '/auth';
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user found' };

    try {
      if (isDemoAuth) {
        const updatedUser = { ...user, ...updates };
        localStorage.setItem('demo_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfile({ ...updatedUser, fullName: `${updatedUser.firstName} ${updatedUser.lastName}` });
        return { error: null };
      } else {
        const response = await apiClient.updateProfile(updates);
        if (response) {
          await fetchProfile();
          return { error: null };
        }
        return { error: 'Failed to update profile' };
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};