/** Phase 1 service boundary — authentication is deliberately not implemented. */
export async function getAuthSessionPlaceholder() { return Promise.resolve({ status: "not-configured" as const }); }
