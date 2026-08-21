import { expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/20260821200000_secure_messaging.sql", import.meta.url), "utf8");

it("creates messaging only from accepted applications and authorizes private realtime participant topics", () => {
  expect(migration).toContain("after update of status on public.applications");
  expect(migration).toContain("old.status <> 'pending'::public.application_status");
  expect(migration).toContain("new.status <> 'accepted'::public.application_status");
  expect(migration).toContain("unique references public.applications(id)");
  expect(migration).toContain("messages_insert_active_participant");
  expect(migration).toContain("conversation_realtime_receive");
  expect(migration).toContain("conversation_realtime_send");
  expect(migration).toContain("'conversation:' || cm.conversation_id::text");
  expect(migration).toContain("alter publication supabase_realtime add table public.conversations, public.conversation_members, public.messages");
});
