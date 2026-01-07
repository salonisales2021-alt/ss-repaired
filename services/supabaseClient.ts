import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * Handles connection to the backend database.
 * gracefully falls back if keys are missing.
 */

// Access environment variables safely
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {}
  
  return undefined;
};

// Retrieve Credentials
const SUPABASE_URL = (getEnv('VITE_SUPABASE_URL') as string) || '';
const SUPABASE_ANON_KEY = (getEnv('VITE_SUPABASE_ANON_KEY') as string) || '';

// Validate Credentials (JWTs are typically long)
export const isLiveData = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 40);

if (isLiveData) {
    console.log("%c LIVE DATABASE CONNECTED ", "background: #10B981; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;");
} else {
    console.warn("%c MOCK MODE ACTIVE - DB CREDENTIALS MISSING ", "background: #F59E0B; color: black; font-weight: bold; padding: 2px 5px; border-radius: 3px;");
}

export const supabase = createClient(
    isLiveData ? SUPABASE_URL : 'https://placeholder.supabase.co', 
    isLiveData ? SUPABASE_ANON_KEY : 'placeholder',
    {
        auth: {
            persistSession: isLiveData,
            autoRefreshToken: isLiveData,
        }
    }
);