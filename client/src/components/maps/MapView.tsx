import { useCallback, useEffect, useRef, useState } from "react";
import { MapPinned } from "lucide-react";
import type { NearbyGig } from "@shared/brikouli.types";
import { MapView as ManagedMapView } from "@/components/Map";
import type { Coordinates } from "@/lib/maps/distance";
import { createGigMarker } from "./GigMarker";
import { MapControls } from "./MapControls";
import { createUserMarker } from "./UserMarker";

type MapMarker = google.maps.marker.AdvancedMarkerElement;
type BrikouliMapViewProps = { center: Coordinates; userLocation: Coordinates | null; gigs: NearbyGig[]; selectedGigId: string | null; onSelect: (gig: NearbyGig) => void; onMapReady?: (map: google.maps.Map) => void; interactive?: boolean };

export function BrikouliMapView({ center, userLocation, gigs, selectedGigId, onSelect, onMapReady, interactive = false }: BrikouliMapViewProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<MapMarker[]>([]);
  const userMarkerRef = useRef<MapMarker | null>(null);
  const [ready, setReady] = useState(false);
  const redraw = useCallback(() => { const map = mapRef.current; if (!map || !window.google?.maps) return; markersRef.current.forEach(marker => marker.map = null); markersRef.current = gigs.map(gig => createGigMarker(map, gig, () => onSelect(gig))).filter((marker): marker is MapMarker => Boolean(marker)); if (userMarkerRef.current) userMarkerRef.current.map = null; userMarkerRef.current = userLocation ? createUserMarker(map, userLocation) : null; }, [gigs, onSelect, userLocation]);
  const handleReady = useCallback((map: google.maps.Map) => { mapRef.current = map; setReady(true); onMapReady?.(map); }, [onMapReady]);
  useEffect(() => { if (interactive) redraw(); }, [interactive, redraw, ready]);
  useEffect(() => { if (interactive && mapRef.current) mapRef.current.panTo({ lat: center.latitude, lng: center.longitude }); }, [center, interactive]);
  useEffect(() => { const selected = gigs.find(gig => gig.id === selectedGigId); if (interactive && selected && mapRef.current && selected.latitude !== null && selected.longitude !== null) mapRef.current.panTo({ lat: selected.latitude, lng: selected.longitude }); }, [gigs, interactive, selectedGigId]);

  if (!interactive) return <div className="brikouli-map map-deferred-state" role="status"><div><MapPinned size={30} /><p>خريطة الحيّ التفاعلية مؤجلة</p><small>يمكنك الاستمرار في استكشاف الفرص حسب النطاق، وسيُفعّل العرض الحي عند توصيل خدمة الخرائط.</small></div></div>;

  const map = mapRef.current;
  return <div className="brikouli-map"><ManagedMapView className="brikouli-map-canvas" initialCenter={{ lat: center.latitude, lng: center.longitude }} initialZoom={13} onMapReady={handleReady} /><MapControls disabled={!ready} onLocate={() => userLocation && mapRef.current?.panTo({ lat: userLocation.latitude, lng: userLocation.longitude })} onZoomIn={() => map && map.setZoom((map.getZoom() ?? 13) + 1)} onZoomOut={() => map && map.setZoom((map.getZoom() ?? 13) - 1)} />{!ready && <div className="map-loading-overlay">جارٍ تحميل الخريطة…</div>}</div>;
}
