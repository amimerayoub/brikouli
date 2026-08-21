import { useEffect, useRef } from "react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { NearbyGig } from "@shared/brikouli.types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, OPENFREEMAP_STYLE_URL } from "@/lib/map/config";
import type { Coordinates } from "@/lib/map/distance";
import { GigMarker } from "./GigMarker";
import { MapControls } from "./MapControls";
import { UserMarker } from "./UserMarker";

type BrikouliMapViewProps = {
  center: Coordinates;
  userLocation: Coordinates | null;
  gigs: NearbyGig[];
  selectedGigId: string | null;
  onSelect: (gig: NearbyGig) => void;
};

export function BrikouliMapView({ center, userLocation, gigs, selectedGigId, onSelect }: BrikouliMapViewProps) {
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    mapRef.current?.flyTo({
      center: [center.longitude, center.latitude],
      duration: 260,
      essential: true,
    });
  }, [center]);

  return (
    <div className="brikouli-map">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_MAP_CENTER.longitude,
          latitude: DEFAULT_MAP_CENTER.latitude,
          zoom: DEFAULT_MAP_ZOOM,
        }}
        mapStyle={OPENFREEMAP_STYLE_URL}
        dragRotate={false}
        touchPitch={false}
        onLoad={() => window.requestAnimationFrame(() => mapRef.current?.resize())}
        onError={event => console.error("[Brikouli MapLibre]", event.error)}
        style={{ width: "100%", height: "100%" }}
        aria-label="خريطة الفرص القريبة"
      >
        <NavigationControl position="bottom-left" showCompass={false} />
        <MapControls
          onLocate={() =>
            userLocation &&
            mapRef.current?.flyTo({
              center: [userLocation.longitude, userLocation.latitude],
              zoom: 14,
              duration: 260,
              essential: true,
            })
          }
        />
        {userLocation && (
          <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
            <UserMarker />
          </Marker>
        )}
        {gigs
          .filter(gig => gig.latitude !== null && gig.longitude !== null)
          .map(gig => (
            <Marker key={gig.id} longitude={gig.longitude!} latitude={gig.latitude!} anchor="bottom">
              <GigMarker gig={gig} selected={gig.id === selectedGigId} onSelect={() => onSelect(gig)} />
            </Marker>
          ))}
      </Map>
    </div>
  );
}
