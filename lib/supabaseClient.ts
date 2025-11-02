// lib/supabaseClient.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// IMPORTANT: set these in Vercel → Settings → Environment Variables
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton client for client components
const supabase: SupabaseClient = createClient(url, anon);
export default supabase;

// Optional factory if you ever need a fresh instance
export function createBrowserClient() {
  return createClient(url, anon);
}