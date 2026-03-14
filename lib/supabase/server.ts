import { createClient } from '@supabase/supabase-js';

/** Get the Supabase admin client (bypasses RLS) */
export function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
