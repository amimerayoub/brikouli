/** Phase 1 service boundary — profile storage will be supplied by the future backend. */
export async function getProfilePlaceholder(_profileId: string) { return Promise.resolve(null); }
