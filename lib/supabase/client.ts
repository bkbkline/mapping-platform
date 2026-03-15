import { createBrowserClient } from '@supabase/ssr';

/** Singleton Supabase client for browser usage (cookie-based auth) */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
