
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * Using the provided project credentials to enable live database functionality.
 */

const getEnvVar = (key: string): string => {
    // Safely access import.meta.env
    const meta = import.meta as any;
    const metaEnv = meta && meta.env ? meta.env : {};
    
    // Safely access process.env (ensure process exists)
    const proc = (typeof process !== 'undefined' && process.env) ? process.env : {};
    
    // Check import.meta.env (Vite Default)
    if (metaEnv[key]) return metaEnv[key];
    // Check process.env (Node/Vite Define)
    if (proc[key]) return proc[key];
    
    return '';
};

// SECURITY PATCH: Removed hardcoded DEFAULT_KEY and DEFAULT_URL.
// Credentials must be supplied via Environment Variables.
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('SUPABASE_URL') || '';
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY') || '';

// Safe check for Development mode
const isDev = () => {
    try {
        const meta = import.meta as any;
        return meta && meta.env && meta.env.DEV;
    } catch (e) {
        return false;
    }
};

export const isLiveData = !!(supabaseUrl && supabaseKey);

if (!isLiveData) {
  // Only warn in dev mode to avoid cluttering prod logs
  if (isDev()) {
      console.warn("Supabase credentials missing in Environment Variables. App will run in limited capability mode.");
  }
} else {
  // Only show connection success in Dev to avoid revealing stack in Prod console
  if (isDev()) {
      console.log("%c CONNECTED TO SUPABASE LIVE DB ", "background: #10B981; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;");
  }
}

export const supabase = isLiveData 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;
