/** Phase 1 service boundary — applications are intentionally deferred. */
export async function createApplicationPlaceholder(_gigId: string) { return Promise.resolve({ status: "not-available" as const }); }
