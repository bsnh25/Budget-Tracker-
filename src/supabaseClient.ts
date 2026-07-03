import { createClient } from '@supabase/supabase-js';

let supabaseUrl = 
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL : '') || '';
const supabaseAnonKey = 
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY : '') || '';

// Clean up trailing '/rest/v1/' or '/rest/v1' if copied from API settings
if (supabaseUrl.endsWith('/rest/v1/')) {
  supabaseUrl = supabaseUrl.slice(0, -9);
} else if (supabaseUrl.endsWith('/rest/v1')) {
  supabaseUrl = supabaseUrl.slice(0, -8);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
