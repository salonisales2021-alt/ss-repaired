
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables for Vite and Process
const getEnv = (key: string, viteKey: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key];
    if (process.env[viteKey]) return process.env[viteKey];
  }
  return '';
};

const SUPABASE_URL = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Validation: Check if keys exist and are not just the placeholder text
const isConfigured = !!(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    SUPABASE_URL !== 'undefined' && 
    !SUPABASE_URL.includes('your-project')
);

// Flag to check if we are using live data configuration
export const isLiveData = isConfigured;

if (isLiveData) {
    console.log("✅ Saloni Sales Portal: Connected to Live Supabase Backend");
} else {
    console.warn("⚠️ Saloni Sales Portal: Running in Mock Mode (Missing Credentials)");
}

// Mock Client Generator to prevent console errors when credentials are missing
const createMockClient = () => {
  // Silent fallback to Mock Mode.
  
  const mockChain = () => {
    const chain: any = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      upsert: () => chain,
      eq: () => chain,
      order: () => chain,
      single: async () => ({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null })
    };
    return chain;
  };

  return {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Mock Mode: Use DB Service' } }),
      signOut: async () => ({ error: null }),
      updateUser: async () => ({ error: null }),
      signUp: async () => ({ data: { user: null }, error: null }),
    },
    from: () => mockChain(),
    storage: {
      from: () => ({
        upload: async () => ({ error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      })
    },
    rpc: async () => ({ data: null, error: null })
  } as any;
};

// Initialize Supabase or Mock
export const supabase = isConfigured 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      db: {
        schema: 'public'
      }
    })
  : createMockClient();
