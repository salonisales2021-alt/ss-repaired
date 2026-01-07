import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization - LIVE MODE
 * Using credentials provided for the Saloni Sales project.
 */

const env = (import.meta as any).env || {};

// Credentials provided
const SUPABASE_URL = (env.VITE_SUPABASE_URL as string) || 'https://tikuoenvshrrweahpvpb.supabase.co';
const SUPABASE_ANON_KEY = (env.VITE_SUPABASE_ANON_KEY as string) || 'Zd_EX3qj2ViINN0gFdx1hzqeMRs5ygLqQb3EBfONvAo';

console.log("%c LIVE DATABASE CONNECTED ", "background: #10B981; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;");

export const isLiveData = true;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);