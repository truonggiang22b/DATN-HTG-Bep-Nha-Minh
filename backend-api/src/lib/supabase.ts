import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';

/** Admin client — uses service role key. Server-side only. Never expose to FE. */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
