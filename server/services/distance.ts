const EARTH_RADIUS_METERS = 6_371_000;
export type Coordinates = { latitude: number; longitude: number };
const radians = (value: number) => value * Math.PI / 180;
export function haversineMeters(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export function formatDistance(meters: number): string { return meters < 1_000 ? `${Math.round(meters)} م` : `${(meters / 1_000).toFixed(1)} كم`; }
