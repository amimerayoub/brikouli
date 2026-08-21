import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
const migration = readFileSync(new URL("../supabase/migrations/20260821210000_trust_safety.sql", import.meta.url), "utf8");
it("enforces completion-gated ratings, private reports, block-aware applications, and non-public audit records in the Phase 8 migration", () => {
  expect(migration).toContain("create table public.trust_audit_log");
  expect(migration).toContain("create unique index if not exists ratings_one_direction_per_gig_idx");
  expect(migration).toContain("create unique index if not exists reports_open_duplicate_idx");
  expect(migration).toContain("create or replace function public.complete_owned_gig");
  expect(migration).toContain("create or replace function public.submit_completion_rating");
  expect(migration).toContain("create or replace function public.create_private_report");
  expect(migration).toContain("applications_create_unblocked_active_gig");
  expect(migration).toContain("revoke insert, update, delete on public.ratings, public.reports, public.user_blocks from authenticated");
  expect(migration).toContain("revoke execute on function public.complete_owned_gig(uuid), public.submit_completion_rating");
});
