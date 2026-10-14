// Centralised env access. Keeps "which var, server vs public" in one place.
// Never import SERVER-only getters into client components.

export const PUBLIC_ENV = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function requireServerEnv() {
  return {
    geminiApiKey: must("GEMINI_API_KEY"),
    geminiModel: process.env.GEMINI_MODEL || "gemini-3.8-flash",
    newsApiKey: process.env.NEWS_API_KEY || "", // optional (dev enrichment)
    apolloApiKey: process.env.APOLLO_API_KEY || "", // company enrichment (who/where to reach)
    // Restricted-role connection for all system-owned writes.
    signalWriterUrl: process.env.SIGNAL_WRITER_DATABASE_URL || "",
    // Mirror-image restricted role for Arjun's OWN CRM edits (human-owned
    // writes). crm_writer can write account_crm/contact_history and has
    // REVOKE ALL on every system table, so this path can never touch
    // signal data — just as signal_writer can never touch Arjun's notes.
    crmWriterUrl: process.env.CRM_WRITER_DATABASE_URL || "",
    cronSecret: process.env.CRON_SECRET || "",
    appTimezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  };
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
