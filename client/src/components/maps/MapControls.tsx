import { LocateFixed } from "lucide-react";
export function MapControls({ onLocate }: { onLocate: () => void }) { return <div className="map-controls" aria-label="عناصر تحكم الخريطة"><button type="button" onClick={onLocate} aria-label="العودة إلى موقعي"><LocateFixed size={20} /></button></div>; }
