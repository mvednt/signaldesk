// Human-owned CRM writes (Arjun editing his OWN notes). Server-only.
//
// Performed as the restricted `crm_writer` Postgres role
// (CRM_WRITER_DATABASE_URL) — the exact mirror of `signal_writer`:
//   - signal_writer  can write system tables, REVOKE ALL on human tables.
//   - crm_writer      can write human tables,  REVOKE ALL on system tables.
// So neither side can cross the boundary even if this code is buggy. Every
// write also uses an EXPLICIT column list (never a blind object) as
// defense-in-depth. The automation pipeline never uses this module, so the
// guarantee "the SYSTEM never overwrites Arjun's notes" is unchanged — this is
// Arjun touching his own.
import "server-only";
import { Pool } from "pg";
import { requireServerEnv } from "@/lib/env";

let _pool: Pool | null = null;

function pool(): Pool {
  const { crmWriterUrl } = requireServerEnv();
  if (!crmWriterUrl) {
    throw new Error(
      "CRM_WRITER_DATABASE_URL is not set. Create the crm_writer role in Supabase " +
        "(migration 0005), set its password, and paste the Transaction-pooler " +
        "connection string into .env.local (and Vercel) to enable Arjun's CRM edits."
    );
  }
  _pool ??= new Pool({ connectionString: crmWriterUrl, max: 3, ssl: { rejectUnauthorized: false } });
  return _pool;
}

/** Set ONLY Arjun's relationship_notes for one account. Upserts the row so an
 *  account with no CRM row yet still works; every other human column is left
 *  exactly as Arjun left it (explicit column list — no blind write). */
export async function updateRelationshipNotes(accountId: string, notes: string): Promise<void> {
  const value = notes.trim() === "" ? null : notes;
  await pool().query(
    `insert into account_crm (account_id, relationship_notes, updated_by)
     values ($1, $2, 'arjun')
     on conflict (account_id) do update set
       relationship_notes = excluded.relationship_notes,
       updated_by = 'arjun'`,
    [accountId, value]
  );
}

export interface VoiceFields {
  company_name: string;
  product: string;
  value_prop: string;
  audience: string;
  tone: string;
  sender_name: string;
  signoff: string;
  guidelines: string;
}

/** Update the company voice persona (human-owned config, written as crm_writer). */
export async function updateCompanyVoice(v: VoiceFields): Promise<void> {
  await pool().query(
    `insert into company_voice
       (id, company_name, product, value_prop, audience, tone, sender_name, signoff, guidelines, updated_by)
     values ('default',$1,$2,$3,$4,$5,$6,$7,$8,'arjun')
     on conflict (id) do update set
       company_name=excluded.company_name, product=excluded.product, value_prop=excluded.value_prop,
       audience=excluded.audience, tone=excluded.tone, sender_name=excluded.sender_name,
       signoff=excluded.signoff, guidelines=excluded.guidelines, updated_by='arjun'`,
    [v.company_name, v.product, v.value_prop, v.audience, v.tone, v.sender_name, v.signoff, v.guidelines]
  );
}

export type Rating = "good" | "bad" | "improve";

/** Record Arjun's rating of an AI-drafted angle (one current rating per signal).
 *  Human-owned input — written as crm_writer, never the automation role. */
export async function upsertOutreachFeedback(
  accountId: string,
  signalEventId: string,
  rating: Rating
): Promise<void> {
  await pool().query(
    `insert into outreach_feedback (account_id, signal_event_id, rating, created_by)
     values ($1, $2, $3, 'arjun')
     on conflict (signal_event_id) do update set rating = excluded.rating`,
    [accountId, signalEventId, rating]
  );
}
