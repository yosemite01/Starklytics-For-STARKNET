import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Demo mode flag
const DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_APP_ENV === 'demo';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yxpbcuoyahjdharayzgs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4cGJjdW95YWhqZGhhcmF5emdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5Njc2NzIsImV4cCI6MjA3MTU0MzY3Mn0.sH4CrEtGEnfO1ns9k6Ppt24kRG398HHznVgkX9EGlQs";

// Creates typed Supabase client with error handling
export const supabase: SupabaseClient<Database> = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: false, // Disable for demo mode
    autoRefreshToken: false, // Disable for demo mode
    detectSessionInUrl: false, // Disable for demo mode
  },
  global: {
    headers: {
      'X-Client-Info': 'starklytics-suite-demo'
    },
    fetch: (url, options = {}) => {
      // Add error handling for demo mode
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json',
        },
      }).catch(error => {
        console.warn('Supabase request failed (demo mode):', error);
        // Return mock response for demo mode
        return new Response(JSON.stringify({ data: null, error: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      });
    }
  }
});