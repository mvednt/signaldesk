-- Reproducible preservation proof (release blocker).
-- Run as an admin role (e.g. via the Supabase SQL editor or MCP execute_sql).
-- PASSES if: a write to a human-owned table AS signal_writer is blocked by the
-- database, AND Arjun's note is unchanged. Self-cleans on success; RAISES on fail.
do $$
declare
  original text := 'ARJUN ORIGINAL NOTE - do not touch';
  after_note text;
  blocked boolean := false;
begin
  insert into accounts(id,name,domain)
    values ('00000000-0000-0000-0000-0000000000aa','__PROOF Co','proof.example')
    on conflict (id) do nothing;
  insert into account_crm(account_id, relationship_notes)
    values ('00000000-0000-0000-0000-0000000000aa', original)
    on conflict (account_id) do update set relationship_notes = excluded.relationship_notes;

  execute format('grant signal_writer to %I', current_user);

  begin
    set local role signal_writer;
    update account_crm set relationship_notes = 'HACKED BY AUTOMATION'
      where account_id = '00000000-0000-0000-0000-0000000000aa';
    reset role;
  exception when insufficient_privilege then
    blocked := true;
    reset role;
  end;

  select relationship_notes into after_note from account_crm
    where account_id = '00000000-0000-0000-0000-0000000000aa';

  delete from accounts where id = '00000000-0000-0000-0000-0000000000aa';

  if blocked and after_note = original then
    raise notice 'PRESERVATION PROOF PASSED: write blocked (insufficient_privilege); human note intact.';
  else
    raise exception 'PRESERVATION PROOF FAILED: blocked=% after_note=%', blocked, after_note;
  end if;
end $$;
