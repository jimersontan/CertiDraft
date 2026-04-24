import { createClient } from "@supabase/supabase-js";

export const SUPABASE_ADMIN_CONFIG_ERROR =
  "Supabase admin access is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to continue.";

export function hasSupabaseAdminEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export function createAdminClient() {
  if (!hasSupabaseAdminEnv()) {
    throw new Error(SUPABASE_ADMIN_CONFIG_ERROR);
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
