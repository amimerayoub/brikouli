import { motion } from "framer-motion";
import type { NearbyGig } from "@shared/brikouli.types";
const categorySymbols: Record<string, string> = { "متاجر": "م", "مطاعم": "ط", "تنظيم": "ت", "استقبال": "ا", "تنظيف": "ن" };
export function markerSymbol(category: string) { return categorySymbols[category] ?? "◔"; }
export function markerClassName(urgent: boolean) { return `map-gig-marker ${urgent ? "map-gig-marker-urgent" : ""}`; }
export function GigMarker({ gig, selected, onSelect }: { gig: NearbyGig; selected: boolean; onSelect: () => void }) { return <motion.button type="button" className={`${markerClassName(gig.urgent)} ${selected ? "is-selected" : ""}`} aria-label={`فتح مهمة ${gig.title}`} onClick={onSelect} initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: selected ? -5 : 0, scale: selected ? 1.12 : 1 }} transition={{ duration: .24, ease: "easeOut" }}><span>{markerSymbol(gig.category)}</span><b>{gig.payment} د</b>{gig.urgent && <i>!</i>}</motion.button>; }
