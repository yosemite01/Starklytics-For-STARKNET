import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yxpbcuoyahjdharayzgs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cGJjdW95YWhqZGhhcmF5emdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5Njc2NzIsImV4cCI6MjA3MTU0MzY3Mn0.sH4CrEtGEnfO1ns9k6Ppt24kRG398HHznVgkX9EGlQs";

// Creates typed Supabase client
export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'starklytics-suite'
    }
  }
});