import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { List, Map as MapIcon, SlidersHorizontal, SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { categories } from "@/lib/phase3-data";
import { requestUserLocation, type LocationState } from "@/lib/map/geolocation";
import { defaultMapMode, type MapMode } from "@/lib/map/mode";
import { DEFAULT_MAP_CENTER } from "@/lib/map/config";
import { readRecentLocationSearches, saveRecentLocationSearch, type LocationSuggestion } from "@/lib/map/search";
import type { Coordinates } from "@/lib/map/distance";
import { AppButton } from "@/components/phase3/AppButton";
import { BottomSheet } from "@/components/phase3/BottomSheet";
import { EmptyState, ErrorState } from "@/components/phase3/EmptyState";
import { SearchField } from "@/components/phase3/SearchField";
import { JobSeekerSearch } from "@/components/jobSeeker/JobSeekerSearch";
import { NoSearchResults } from "@/components/jobSeeker/JobSeekerFeedback";
import { addFavoriteId, removeFavoriteId } from "@/lib/favorites";
import { BrikouliMapView } from "./MapView";
import { MarkerPopup } from "./MarkerPopup";

const fallbackLocation: Coordinates = DEFAULT_MAP_CENTER;

export function MapDiscovery() {
  const [location, setLocation] = useState<LocationState>({ status: "loading", coordinates: null, message: null });
  const [center, setCenter] = useState<Coordinates>(fallbackLocation);
  const [mode, setMode] = useState<MapMode>(() => typeof window !== "undefined" ? defaultMapMode(window.innerWidth) : "map");
  const [radiusKm, setRadiusKm] = useState<1 | 3 | 5 | 10>(5);
  const [sort, setSort] = useState<"distance" | "newest" | "highest_pay">("distance");
  const [category, setCategory] = useState<string | undefined>();
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gigSearch, setGigSearch] = useState("");
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedGigId, setSelectedGigId] = useState<string | null>(null);
  const searchLocations = trpc.brikouli.locations.search.useMutation({ onSuccess: response => { if (!response.success) { toast.error(response.message); return; } setSuggestions(response.data); if (!response.data.length) toast.info("لم نعثر على موقع مطابق. جرّب المدينة أو الحي بشكل أوضح."); } });
  const { isAuthenticated } = useSupabaseSession();
  const favoriteIds = trpc.brikouli.favorites.ids.useQuery(undefined, { enabled: isAuthenticated, staleTime: 15_000 });
  const utils = trpc.useUtils();
  const saveGig = trpc.brikouli.favorites.save.useMutation({ onMutate: async ({ gigId }) => { await utils.brikouli.favorites.ids.cancel(); const previousIds = utils.brikouli.favorites.ids.getData(); utils.brikouli.favorites.ids.setData(undefined, current => current?.success ? { success: true, data: addFavoriteId(current.data, gigId) } : current); return { previousIds }; }, onError: (_error, _input, context) => { if (context?.previousIds) utils.brikouli.favorites.ids.setData(undefined, context.previousIds); toast.error("تعذر تحديث المحفوظات الآن."); }, onSettled: () => { void utils.brikouli.favorites.ids.invalidate(); void utils.brikouli.favorites.list.invalidate(); } });
  const removeGig = trpc.brikouli.favorites.remove.useMutation({ onMutate: async ({ gigId }) => { await utils.brikouli.favorites.ids.cancel(); const previousIds = utils.brikouli.favorites.ids.getData(); utils.brikouli.favorites.ids.setData(undefined, current => current?.success ? { success: true, data: removeFavoriteId(current.data, gigId) } : current); return { previousIds }; }, onError: (_error, _input, context) => { if (context?.previousIds) utils.brikouli.favorites.ids.setData(undefined, context.previousIds); toast.error("تعذر تحديث المحفوظات الآن."); }, onSettled: () => { void utils.brikouli.favorites.ids.invalidate(); void utils.brikouli.favorites.list.invalidate(); } });

  useEffect(() => { requestUserLocation().then(result => { setLocation(result); if (result.coordinates) setCenter(result.coordinates); }); setRecentSearches(readRecentLocationSearches()); }, []);

  const queryInput = useMemo(() => ({ latitude: center.latitude, longitude: center.longitude, radiusKm, sort, category, urgentOnly, limit: 50 }), [center, radiusKm, sort, category, urgentOnly]);
  const nearby = trpc.brikouli.gigs.nearby.useQuery(queryInput, { staleTime: 15_000, refetchInterval: 30_000 });
  const deferredGigSearch = useDeferredValue(gigSearch.trim());
  const nearbyGigs = nearby.data?.success ? nearby.data.data : [];
  const gigs = useMemo(() => { if (!deferredGigSearch) return nearbyGigs; const query = deferredGigSearch.toLocaleLowerCase("ar"); return nearbyGigs.filter(gig => [gig.title, gig.category, gig.city, gig.neighborhood ?? "", gig.employerName].some(value => value.toLocaleLowerCase("ar").includes(query))); }, [nearbyGigs, deferredGigSearch]);
  const selectedGig = gigs.find(gig => gig.id === selectedGigId) ?? null;
  const savedGigIds = new Set(favoriteIds.data?.success ? favoriteIds.data.data : []);

  const searchLocation = () => { if (search.trim().length < 2) { toast.info("اكتب حرفين على الأقل للبحث."); return; } searchLocations.mutate({ query: search }); };
  const chooseSuggestion = (suggestion: LocationSuggestion) => { setCenter({ latitude: suggestion.latitude, longitude: suggestion.longitude }); setSuggestions([]); setSearch(suggestion.label); setRecentSearches(saveRecentLocationSearch(suggestion.label)); toast.success("تم تحديث منطقة البحث"); };
  const resetFilters = () => { setCategory(undefined); setUrgentOnly(false); setSort("distance"); setRadiusKm(5); };
  const toggleSelectedGigSave = () => { if (!selectedGig) return; if (!isAuthenticated) { toast.info("سجّل الدخول لحفظ الفرص ومتابعتها من حسابك."); return; } const saved = savedGigIds.has(selectedGig.id); (saved ? removeGig : saveGig).mutate({ gigId: selectedGig.id }, { onSuccess: response => { if (!response.success) { toast.error(response.message); return; } toast.success(saved ? "أزلنا الفرصة من المحفوظات" : "حُفظت الفرصة في حسابك"); } }); };

  return <section className={`map-discovery map-mode-${mode}`}>
    <header className="map-discovery-header"><div><p>استكشف على الخريطة</p><h1>فرص <em>قريبة</em> منك</h1></div><div className="map-mode-switch" aria-label="طريقة العرض"><button className={mode === "list" ? "is-active" : ""} onClick={() => setMode("list")} aria-label="عرض القائمة"><List size={18} /></button><button className={mode === "map" ? "is-active" : ""} onClick={() => setMode("map")} aria-label="عرض الخريطة"><MapIcon size={18} /></button><button className={mode === "split" ? "is-active" : ""} onClick={() => setMode("split")} aria-label="عرض منقسم"><SplitSquareHorizontal size={18} /></button></div></header>
    <div className="map-search-wrap"><SearchField value={search} onChange={setSearch} onFilter={searchLocation} placeholder="ابحث عن مدينة أو حي" label="البحث عن موقع" />{suggestions.length > 0 && <div className="location-suggestions">{suggestions.map(suggestion => <button type="button" key={suggestion.label} onClick={() => chooseSuggestion(suggestion)}>{suggestion.label}</button>)}</div>}{suggestions.length === 0 && recentSearches.length > 0 && <div className="recent-location-searches"><span>عمليات بحث حديثة</span>{recentSearches.map(item => <button key={item} type="button" onClick={() => { setSearch(item); searchLocations.mutate({ query: item }); }}>{item}</button>)}</div>}</div>
    <div className="map-gig-search"><JobSeekerSearch value={gigSearch} onChange={setGigSearch} placeholder="ابحث في الفرص القريبة" label="البحث الفوري في الفرص القريبة" /></div>
    <div className="map-filter-row"><div>{([1, 3, 5, 10] as const).map(radius => <button key={radius} className={radiusKm === radius ? "is-selected" : ""} onClick={() => setRadiusKm(radius)}>{radius} كم</button>)}</div><button type="button" className="map-filter-button" onClick={() => setFilterOpen(true)}><SlidersHorizontal size={17} /> تصفية</button></div>
    {location.status !== "ready" && <p className="location-notice">{location.status === "loading" ? "جارٍ طلب موقعك دون تعطيل الاستكشاف…" : location.message}</p>}
    <div className="map-workspace"><div className="map-panel map-paper-panel"><BrikouliMapView center={center} userLocation={location.coordinates} gigs={gigs} selectedGigId={selectedGigId} onSelect={gig => setSelectedGigId(gig.id)} /></div><div className="map-list-panel">{nearby.isLoading ? <div className="map-list-loading">جارٍ تحديث الفرص القريبة…</div> : nearby.data && !nearby.data.success ? <ErrorState onRetry={() => nearby.refetch()} /> : gigs.length === 0 ? (gigSearch ? <NoSearchResults query={gigSearch} /> : <EmptyState title="لا تظهر فرص ضمن هذا النطاق الآن" description="وسّع المسافة أو عد بعد قليل — ستظهر هنا منشورات الحي المتاحة قربك." />) : gigs.map(gig => <button type="button" className={`map-gig-row ${selectedGigId === gig.id ? "is-selected" : ""}`} onClick={() => setSelectedGigId(gig.id)} key={gig.id}><span>{gig.category.slice(0, 1)}</span><div><b>{gig.title}</b><small>{gig.employerName} · {gig.payment} د.م</small></div><em>{Math.round(gig.distanceMeters)} م</em></button>)}</div></div>
    <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="تصفية الفرص"><div className="map-filter-sheet"><p>تُطبّق التغييرات فوراً على القائمة والخريطة.</p><label>الفئة</label><div className="map-chip-grid"><button className={!category ? "is-selected" : ""} onClick={() => setCategory(undefined)}>الكل</button>{categories.map(item => <button key={item} className={category === item ? "is-selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div><label>الترتيب</label><div className="map-chip-grid"><button className={sort === "distance" ? "is-selected" : ""} onClick={() => setSort("distance")}>الأقرب</button><button className={sort === "newest" ? "is-selected" : ""} onClick={() => setSort("newest")}>الأحدث</button><button className={sort === "highest_pay" ? "is-selected" : ""} onClick={() => setSort("highest_pay")}>الأعلى مقابلاً</button></div><button className={`urgent-filter ${urgentOnly ? "is-selected" : ""}`} onClick={() => setUrgentOnly(value => !value)}>عاجلة فقط</button><AppButton variant="secondary" onClick={resetFilters}>إعادة الضبط</AppButton></div></BottomSheet>
    <BottomSheet open={Boolean(selectedGig)} onClose={() => setSelectedGigId(null)} title="تفاصيل الفرصة"><>{selectedGig && <MarkerPopup gig={selectedGig} onClose={() => setSelectedGigId(null)} isSaved={savedGigIds.has(selectedGig.id)} onToggleSave={toggleSelectedGigSave} />}</></BottomSheet>
  </section>;
}
