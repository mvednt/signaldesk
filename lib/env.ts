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
    // Restricted-role connection for all system-owned writes.
    signalWriterUrl: process.env.SIGNAL_WRITER_DATABASE_URL || "",
    cronSecret: process.env.CRON_SECRET || "",
    appTimezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
  };
}

function must(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}
