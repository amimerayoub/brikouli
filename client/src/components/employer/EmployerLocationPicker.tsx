import React, { useMemo, useState } from "react";
import { Crosshair, Grip, MapPin, Search } from "lucide-react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { trpc } from "@/lib/trpc";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM, OPENFREEMAP_STYLE_URL } from "@/lib/map/config";
import { requestUserLocation } from "@/lib/map/geolocation";
import type { Coordinates } from "@/lib/map/distance";

export function EmployerLocationPicker({ value, onChange, onLocationLabel }: { value: Coordinates; onChange: (value: Coordinates) => void; onLocationLabel: (label: string) => void }) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const search = trpc.brikouli.locations.search.useMutation();
  const suggestions = useMemo(() => search.data?.success ? search.data.data : [], [search.data]);
  const submitSearch = () => { const term = query.trim(); if (term.length < 2) { setMessage("اكتب حرفين على الأقل للبحث عن المكان."); return; } setMessage(null); search.mutate({ query: term }); };
  const locate = async () => { setMessage(null); const result = await requestUserLocation(); if (!result.coordinates) { setMessage(result.message); return; } onChange(result.coordinates); };
  const selectSuggestion = (suggestion: { label: string; latitude: number; longitude: number }) => { onChange({ latitude: suggestion.latitude, longitude: suggestion.longitude }); onLocationLabel(suggestion.label); setQuery(suggestion.label); };
  return <section className="employer-location-picker"><div className="employer-location-search"><label htmlFor="employer-location-query">ابحث عن موقع</label><div><input id="employer-location-query" value={query} onChange={event => setQuery(event.target.value)} placeholder="مثال: المعاريف، الدار البيضاء" /><button type="button" onClick={submitSearch} aria-label="بحث عن موقع"><Search size={18} /></button></div><button type="button" className="employer-locate" onClick={locate}><Crosshair size={17} /> استخدام موقعي الحالي</button></div>{(message || search.isError) && <p className="employer-form-message is-error">{message ?? "تعذر البحث عن الموقع الآن."}</p>}{suggestions.length > 0 && <div className="employer-location-suggestions" role="listbox" aria-label="اقتراحات الموقع">{suggestions.map(suggestion => <button key={`${suggestion.latitude}-${suggestion.longitude}`} type="button" role="option" onClick={() => selectSuggestion(suggestion)}><MapPin size={15} /> {suggestion.label}</button>)}</div>}<div className="employer-picker-map"><Map initialViewState={{ longitude: value.longitude ?? DEFAULT_MAP_CENTER.longitude, latitude: value.latitude ?? DEFAULT_MAP_CENTER.latitude, zoom: DEFAULT_MAP_ZOOM }} longitude={value.longitude} latitude={value.latitude} mapStyle={OPENFREEMAP_STYLE_URL} dragRotate={false} touchPitch={false} onClick={event => onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })} onLoad={event => window.requestAnimationFrame(() => event.target.resize())} style={{ width: "100%", height: "100%" }} aria-label="خريطة اختيار موقع الفرصة"><NavigationControl position="bottom-left" showCompass={false} /><Marker longitude={value.longitude} latitude={value.latitude} anchor="bottom" draggable onDragEnd={event => onChange({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })}><span className="employer-map-pin" aria-label="اسحب علامة الموقع"><MapPin size={23} /><Grip size={10} /></span></Marker></Map></div><p className="employer-location-caption">الموقع: {value.latitude.toFixed(5)}، {value.longitude.toFixed(5)}. انقر على الخريطة أو اسحب العلامة لتحديد المكان بدقة.</p></section>;
}
