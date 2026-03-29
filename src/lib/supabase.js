import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!import.meta.env.VITE_SUPABASE_URL) {
  console.warn('Supabase URL is missing from .env! Please add VITE_SUPABASE_URL.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
