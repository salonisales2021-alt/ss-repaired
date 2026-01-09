
import { createClient } from '@supabase/supabase-js';

// Safe access to environment variables for Vite
const env = (import.meta as any).env || {};
const processEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

// Priority: 1. Vite Env, 2. Process Env, 3. Hardcoded Fallback (from your provided .env)
const SUPABASE_URL = env.VITE_SUPABASE_URL || processEnv.SUPABASE_URL || 'https://tikuoenvshrrweahpvpb.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || processEnv.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa3VvZW52c2hycndlYWhwdnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTc0MDcsImV4cCI6MjA4MDA3MzQwN30.Zd_EX3qj2ViINN0gFdx1hzqeMRs5ygLqQb3EBfONvAo';

// Check if configuration looks valid
const isConfigured = !!(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_URL.startsWith('http'));

if (!isConfigured) {
  console.warn('Supabase credentials missing or invalid. App running in disconnected mode. Data will not load.');
}

// Fallback to placeholders to prevent client initialization crash if absolutely nothing is found
const url = isConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co';
const key = isConfigured ? SUPABASE_ANON_KEY : 'placeholder';

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});

// Flag to check if we are using live data configuration
export const isLiveData = isConfigured;
