
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
const clean = (str: string | undefined | null) => str ? str.trim() : '';

const SUPABASE_URL = clean(
    localStorage.getItem('VITE_SUPABASE_URL') || 
    (getEnv('VITE_SUPABASE_URL') as string) || 
    (getEnv('SUPABASE_URL') as string) || 
    ''
);

const SUPABASE_ANON_KEY = clean(
    localStorage.getItem('VITE_SUPABASE_ANON_KEY') || 
    (getEnv('VITE_SUPABASE_ANON_KEY') as string) || 
    (getEnv('SUPABASE_ANON_KEY') as string) || 
    ''
);

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
    console.log("✅ LIVE DB CONNECTED: " + SUPABASE_URL);
} else {
    // Switched from warn to info to reduce console noise during development/demo
    console.info("ℹ️ DEMO MODE ACTIVE: Using local mock data. (Connect Supabase in Admin Settings to go live)");
}

export const supabase = createClient(
    isLiveData ? SUPABASE_URL : 'https://placeholder.supabase.co', 
    isLiveData ? SUPABASE_ANON_KEY : 'placeholder'
);

// Helper to verify connection credentials without reloading
export const testConnection = async (url: string, key: string) => {
    if (!url || !key) return { success: false, error: "Missing credentials" };
    if (!isValidUrl(url)) return { success: false, error: "Invalid URL format" };
    
    try {
        const tempClient = createClient(url, key);
        // Try to fetch 1 row from 'products' (assumes schema exists)
        // Using 'head' to minimize data transfer
        const { error } = await tempClient.from('products').select('id', { count: 'exact', head: true });
        
        if (error) {
            // If table doesn't exist (404/PGRST204) but auth worked, it's partial success (connected but no schema)
            // But usually we want to catch auth errors
            if (error.code === 'PGRST116' || error.message.includes('relation "public.products" does not exist')) {
                 return { success: true, warning: "Connected, but 'products' table missing. Run Schema Script." };
            }
            throw error;
        }
        
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Connection failed" };
    }
};
