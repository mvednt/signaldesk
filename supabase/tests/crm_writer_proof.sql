-- Symmetric boundary proof for crm_writer (companion to preservation_proof.sql).
-- Run as an admin role (Supabase SQL editor / MCP execute_sql).
-- PASSES if, AS crm_writer: writing account_crm (a human table) SUCCEEDS, and
-- writing signal_events (a system table) is BLOCKED by the database.
-- Self-cleans on success; RAISES on failure.
do $$
declare
  wrote_human text;
  blocked_system boolean := false;
begin
  insert into accounts(id,name,domain)
    values ('00000000-0000-0000-0000-0000000000bb','__PROOF Crm','proofcrm.example')
    on conflict (id) do nothing;

  execute format('grant crm_writer to %I', current_user);

  -- 1) crm_writer SHOULD be able to write Arjun's own table.
  set local role crm_writer;
  insert into account_crm(account_id, relationship_notes, updated_by)
    values ('00000000-0000-0000-0000-0000000000bb', 'crm_writer wrote this', 'arjun')
    on conflict (account_id) do update set relationship_notes = excluded.relationship_notes;
  reset role;

  select relationship_notes into wrote_human from account_crm
    where account_id = '00000000-0000-0000-0000-0000000000bb';

  -- 2) crm_writer SHOULD NOT be able to write a system table.
  begin
    set local role crm_writer;
    insert into signal_events(account_id, source, title, content_hash, status)
      values ('00000000-0000-0000-0000-0000000000bb','manual','__proof','__proof_hash_crm','new');
    reset role;
  exception when insufficient_privilege then
    blocked_system := true;
    reset role;
  end;

  delete from account_crm where account_id = '00000000-0000-0000-0000-0000000000bb';
  delete from accounts     where id = '00000000-0000-0000-0000-0000000000bb';

  if wrote_human = 'crm_writer wrote this' and blocked_system then
    raise notice 'CRM_WRITER PROOF PASSED: human write allowed; system write blocked (insufficient_privilege).';
  else
    raise exception 'CRM_WRITER PROOF FAILED: wrote_human=% blocked_system=%', wrote_human, blocked_system;
  end if;
end $$;
