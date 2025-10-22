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
  signUp: (
    email: string,
    password: string,
    userData?: { firstName?: string; lastName?: string; role?: 'analyst' | 'creator' }
  ) => Promise<{ error: any }>;
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

  // Demo auth mode (local-only), everything else uses production API
  const isDemoAuth = true;

  const fetchProfile = async () => {
    try {
      if (isDemoAuth) {
        const storedUser = localStorage.getItem('demo_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser) as User;
          setUser(userData);
          setProfile({
            ...userData,
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
          });
        }
      } else {
        const response = await apiClient.get('/api/profile');
        if (response?.data) {
          const userData = response.data as User;
          setUser(userData);
          setProfile({
            ...userData,
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
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
        if (token) await fetchProfile();
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem('auth_token');
      }
      setLoading(false);
