// Read-only Supabase client (anon key). RLS allows SELECT on all tables.
// This client is NEVER used to write — writes go through lib/db/writer.ts as
// the restricted signal_writer role, and human CRM writes via an authed path.
import { createClient } from "@supabase/supabase-js";
import { PUBLIC_ENV } from "@/lib/env";

export function createReadClient() {
  return createClient(PUBLIC_ENV.supabaseUrl, PUBLIC_ENV.supabaseAnonKey, {
    auth: { persistSession: false },
  });
}
