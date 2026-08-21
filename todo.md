# Brikouli Phase 2 — implementation checklist

- [x] Upgrade the project to the managed full-stack foundation required for server-side authentication and protected services.
- [x] Define Supabase SQL migrations for profiles, gigs, applications, ratings, reports, enums, storage buckets, and row-level security.
- [x] Add typed Zod schemas, API response contracts, and server-side role helpers.
- [x] Build the Arabic RTL authentication routes, legal-consent capture, and session-aware route protection.
- [x] Implement server actions and service boundaries without direct client-side SQL or privileged credentials.
- [x] Prepare realistic Moroccan Arabic seed data and test coverage for authentication and authorization boundaries.
- [x] Update documentation, run production verification, save a checkpoint, and deliver the Phase 2 build.
- [x] Add server-enforced private-route middleware with role-specific 403 behavior for employer and admin paths.
- [x] Align action files to the requested login/register/logout/profile structure and make browser flows invoke validated action endpoints.
- [x] Expand focused tests for session persistence, protected routes, role authorization, and CRUD permission boundaries.
- [x] Re-run final verification, review the completed todo list, and save the Phase 2 checkpoint.
