import { useEffect, useRef, useState } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import Map, { Marker, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { NearbyGig } from "@shared/brikouli.types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, OPENFREEMAP_STYLE_URL, OPENSTREETMAP_FALLBACK_STYLE } from "@/lib/map/config";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [styleSource, setStyleSource] = useState<"openfreemap" | "openstreetmap">("openfreemap");
  const [attempt, setAttempt] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);

  useEffect(() => {
    mapRef.current?.flyTo({
      center: [center.longitude, center.latitude],
      duration: 260,
      essential: true,
    });
  }, [center]);

  useEffect(() => {
    const resize = () => window.requestAnimationFrame(() => mapRef.current?.resize());
    resize();
    const element = containerRef.current;
    let observer: ResizeObserver | undefined;
    if (element && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(resize);
      observer.observe(element);
    }
    window.addEventListener("resize", resize);
    return () => { observer?.disconnect(); window.removeEventListener("resize", resize); };
  }, [attempt]);

  useEffect(() => {
    if (isReady) return;
    const timeout = window.setTimeout(() => {
      if (styleSource === "openfreemap") setStyleSource("openstreetmap");
      else setHasFailed(true);
    }, 4_000);
    return () => window.clearTimeout(timeout);
  }, [attempt, isReady, styleSource]);

  const retry = () => { setIsReady(false); setHasFailed(false); setStyleSource("openfreemap"); setAttempt(value => value + 1); };
  const handleMapError = () => {
    if (styleSource === "openfreemap") {
      setIsReady(false);
      setStyleSource("openstreetmap");
      return;
    }
    setHasFailed(true);
  };

  return (
    <div className="brikouli-map" ref={containerRef}>
      <Map
        key={`${styleSource}-${attempt}`}
        ref={mapRef}
        initialViewState={{
          longitude: DEFAULT_MAP_CENTER.longitude,
          latitude: DEFAULT_MAP_CENTER.latitude,
          zoom: DEFAULT_MAP_ZOOM,
        }}
        mapStyle={styleSource === "openfreemap" ? OPENFREEMAP_STYLE_URL : OPENSTREETMAP_FALLBACK_STYLE}
        dragRotate={false}
        touchPitch={false}
        onLoad={() => { setIsReady(true); window.requestAnimationFrame(() => mapRef.current?.resize()); }}
        onStyleData={() => {
          if (mapRef.current?.isStyleLoaded()) {
            setIsReady(true);
            window.requestAnimationFrame(() => mapRef.current?.resize());
          }
        }}
        onError={handleMapError}
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
      {!isReady && !hasFailed && <div className="map-loading-overlay" role="status"><LoaderCircle size={22} className="animate-spin" /><span>تحميل الخريطة...</span></div>}
      {hasFailed && <div className="map-error-overlay" role="alert"><p>تعذر تحميل الخريطة</p><button type="button" onClick={retry}><RefreshCw size={16} />إعادة المحاولة</button></div>}
    </div>
  );
}
