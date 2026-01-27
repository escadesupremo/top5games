import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const RAWG_API_KEY = import.meta.env.VITE_RAWG_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

if (!RAWG_API_KEY) {
  throw new Error('Missing RAWG API key. Please check your .env file.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export { SUPABASE_URL, RAWG_API_KEY };
