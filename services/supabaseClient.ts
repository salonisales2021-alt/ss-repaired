import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization - LIVE MODE
 * Using credentials provided for the Saloni Sales project.
 */

// Access environment variables safely for Vite and other environments
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error
  }

  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key];
    }
  } catch (e) {
    // Ignore error
  }
  
  return undefined;
};

// Credentials provided
const SUPABASE_URL = (getEnv('VITE_SUPABASE_URL') as string) || 'https://tikuoenvshrrweahpvpb.supabase.co';
const SUPABASE_ANON_KEY = (getEnv('VITE_SUPABASE_ANON_KEY') as string) || 'Zd_EX3qj2ViINN0gFdx1hzqeMRs5ygLqQb3EBfONvAo';

console.log("%c LIVE DATABASE CONNECTED ", "background: #10B981; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;");

export const isLiveData = true;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);