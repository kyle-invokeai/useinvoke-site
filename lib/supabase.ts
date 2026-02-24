import { createClient } from '@supabase/supabase-js';

// Use service role key for server-side operations (bypasses RLS)
// Fallback to anon key if service key not set (for local dev)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create client only if credentials are available, otherwise create a dummy client
// that will fail gracefully at runtime
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : createClient('http://localhost', 'dummy-key-for-build', {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

// Client-side Supabase instance (for browser use)
export function createClientSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase URL and Anon Key must be configured');
  }
  
  return createClient(url, key);
}
