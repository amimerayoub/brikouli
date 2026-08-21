/** Phase 1 service boundary — the UI must consume services, never SQL directly. */
export type GigQuery = { category?: string; location?: string };
export async function listGigsPlaceholder(_query: GigQuery = {}) { return Promise.resolve([] as const); }
