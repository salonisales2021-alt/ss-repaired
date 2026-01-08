
import { createClient } from '@supabase/supabase-js';

// Access environment variables safely, checking both import.meta.env and process.env
// and handling potential variable renaming by Vite (VITE_ prefix vs bare name)
const getEnv = (key: string) => {
  let val: string | undefined;

  try {
    // 1. Check import.meta.env (Vite standard)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      val = import.meta.env[key];
    }
  } catch (e) {}

  if (val) return val;

  try {
    // 2. Check process.env (Vite shim / Node)
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      val = process.env[key];
    }
  } catch (e) {}
  
  return val;
};

// Retrieve Credentials - Priority: LocalStorage > Env Vars (VITE_ prefixed) > Env Vars (Standard)
const SUPABASE_URL = 
    localStorage.getItem('VITE_SUPABASE_URL') || 
    (getEnv('VITE_SUPABASE_URL') as string) || 
    (getEnv('SUPABASE_URL') as string) || 
    '';

const SUPABASE_ANON_KEY = 
    localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 
    (getEnv('VITE_SUPABASE_ANON_KEY') as string) || 
    (getEnv('SUPABASE_ANON_KEY') as string) || 
    '';

// Strict validation of URL format
const isValidUrl = (url: string) => {
    try {
        new URL(url);
        return url.startsWith('http');
    } catch {
        return false;
    }
};

// Check if keys are valid
export const isLiveData = !!(SUPABASE_URL && SUPABASE_ANON_KEY && isValidUrl(SUPABASE_URL));

if (isLiveData) {
    console.log("✅ CONNECTED TO SUPABASE LIVE DB");
    console.log("Endpoint:", SUPABASE_URL);
} else {
    console.warn("⚠️ SUPABASE CREDENTIALS MISSING - App running in local fallback mode.");
    if (!SUPABASE_URL) console.warn("Missing: VITE_SUPABASE_URL");
    else if (!isValidUrl(SUPABASE_URL)) console.warn("Invalid URL: VITE_SUPABASE_URL");
    if (!SUPABASE_ANON_KEY) console.warn("Missing: VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
    isLiveData ? SUPABASE_URL : 'https://placeholder.supabase.co', 
    isLiveData ? SUPABASE_ANON_KEY : 'placeholder'
);
