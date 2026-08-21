import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const migration = readFileSync(new URL("../supabase/migrations/20260821220000_super_admin_foundation.sql", import.meta.url), "utf8");
const helperGrants = readFileSync(new URL("../supabase/migrations/20260821221000_admin_helper_grants.sql", import.meta.url), "utf8");
const rlsHelperGrants = readFileSync(new URL("../supabase/migrations/20260821230000_restore_rls_policy_helper_grants.sql", import.meta.url), "utf8");
describe("Phase 9 admin database boundaries", () => {
  it("keeps administrative state, audit records, protected commands, and account enforcement in the database", () => {
    expect(migration).toContain("account_status public.account_status not null default 'active'");
    expect(migration).toContain("create table if not exists public.admin_audit_logs");
    expect(migration).toContain("alter table public.admin_audit_logs enable row level security");
    expect(migration).toContain("create policy \"admin_audit_logs_admin_only\"");
    expect(migration).toContain("create trigger applications_require_active_account");
    expect(migration).toContain("create trigger gigs_require_active_account");
    expect(migration).toContain("create trigger messages_require_active_account");
    expect(migration).toContain("if not public.is_admin() then raise exception");
    expect(migration).toContain("if p_user_id = (select auth.uid()) then raise exception");
    expect(migration).toContain("public.admin_set_account_status(uuid, public.account_status, text)");
    expect(migration).toContain("from public, anon");
    expect(helperGrants).toContain("revoke execute on function public.write_admin_audit(text, text, uuid, jsonb) from authenticated");
    expect(rlsHelperGrants).toContain("grant execute on function public.is_admin(), public.is_job_seeker(), public.is_active_account() to authenticated");
    expect(rlsHelperGrants).toContain("revoke execute on function public.is_admin(), public.is_job_seeker(), public.is_active_account() from anon");
  });
});
