/** Search is submitted explicitly; no request is made while users type, respecting public Nominatim limits. */
export type LocationSuggestion = { label: string; latitude: number; longitude: number };
export const RECENT_LOCATION_KEY = "brikouli-recent-location-searches";
export function saveRecentLocationSearch(label: string) { const current = JSON.parse(localStorage.getItem(RECENT_LOCATION_KEY) ?? "[]") as string[]; const next = [label, ...current.filter(item => item !== label)].slice(0, 4); localStorage.setItem(RECENT_LOCATION_KEY, JSON.stringify(next)); return next; }
export function readRecentLocationSearches() { try { return JSON.parse(localStorage.getItem(RECENT_LOCATION_KEY) ?? "[]") as string[]; } catch { return []; } }
