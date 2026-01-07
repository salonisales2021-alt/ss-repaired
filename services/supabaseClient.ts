
import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization - LIVE MODE
 * Using credentials provided for the Saloni Sales project.
 */

// Credentials provided
const SUPABASE_URL = 'https://tikuoenvshrrweahpvpb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpa3VvZW52c2hycndlYWhwdnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTc0MDcsImV4cCI6MjA4MDA3MzQwN30.Zd_EX3qj2ViINN0gFdx1hzqeMRs5ygLqQb3EBfONvAo';

console.log("%c LIVE DATABASE CONNECTED ", "background: #10B981; color: white; font-weight: bold; padding: 2px 5px; border-radius: 3px;");

export const isLiveData = true;
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
