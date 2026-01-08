import { createClient } from '@supabase/supabase-js';

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

// Retrieve Credentials - Priority: LocalStorage > Env Vars
const SUPABASE_URL = localStorage.getItem('VITE_SUPABASE_URL') || (getEnv('VITE_SUPABASE_URL') as string) || '';
const SUPABASE_ANON_KEY = localStorage.getItem('VITE_SUPABASE_ANON_KEY') || (getEnv('VITE_SUPABASE_ANON_KEY') as string) || '';

// Check if keys are valid (simple length check to avoid placeholders)
export const isLiveData = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

if (isLiveData) {
    console.log("✅ CONNECTED TO SUPABASE LIVE DB");
} else {
    console.warn("⚠️ SUPABASE CREDENTIALS MISSING - App running in local fallback mode.");
}

export const supabase = createClient(
    isLiveData ? SUPABASE_URL : 'https://placeholder.supabase.co', 
    isLiveData ? SUPABASE_ANON_KEY : 'placeholder'
);