"use server";

import { revalidatePath } from "next/cache";
import { updateRelationshipNotes } from "@/lib/db/crm";

export type SaveResult = { ok: true } | { ok: false; error: string };

const MAX_NOTES = 4000;

/** Save Arjun's relationship notes for one account (human-owned write). */
export async function saveRelationshipNotes(accountId: string, notes: string): Promise<SaveResult> {
  if (!accountId) return { ok: false, error: "Missing account." };
  if (notes.length > MAX_NOTES) return { ok: false, error: `Notes are too long (max ${MAX_NOTES} characters).` };
  try {
    await updateRelationshipNotes(accountId, notes);
    // Refresh every view that renders CRM notes.
    revalidatePath("/");
    revalidatePath("/accounts");
    revalidatePath("/hotlist");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
