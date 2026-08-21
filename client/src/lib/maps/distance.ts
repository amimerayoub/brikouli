export type Coordinates = { latitude: number; longitude: number };
const radians = (value: number) => value * Math.PI / 180;
export function haversineMeters(from: Coordinates, to: Coordinates): number { const latDelta = radians(to.latitude - from.latitude); const lngDelta = radians(to.longitude - from.longitude); const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(lngDelta / 2) ** 2; return 2 * 6_371_000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
export function formatDistance(meters: number) { return meters < 1_000 ? `${Math.round(meters)} م` : `${(meters / 1_000).toFixed(1)} كم`; }
