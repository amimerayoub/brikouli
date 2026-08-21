import { expect, it } from "vitest";
import { readFileSync } from "node:fs";

const workspaceMigration = readFileSync(new URL("../supabase/migrations/20260821190000_employer_workspace.sql", import.meta.url), "utf8");
const rlsMigration = readFileSync(new URL("../supabase/migrations/20260821191000_employer_workspace_rls.sql", import.meta.url), "utf8");
const deleteMigration = readFileSync(new URL("../supabase/migrations/20260821192000_employer_safe_delete.sql", import.meta.url), "utf8");

it("keeps ownership and single-hire enforcement in database-side employer RPCs and policies", () => {
  expect(workspaceMigration).toContain("review_employer_application"); expect(workspaceMigration).toContain("acceptance_limit"); expect(workspaceMigration).toContain("message = 'ACCEPTANCE_LIMIT_REACHED'");
  expect(rlsMigration).toContain("update_employer_business_profile"); expect(rlsMigration).toContain("gigs.employer_id = (select auth.uid())");
  expect(deleteMigration).toContain("delete_employer_gig"); expect(deleteMigration).toContain("GIG_MUST_BE_CANCELLED_FIRST"); expect(deleteMigration).toContain("GIG_HAS_APPLICANT_HISTORY");
});
