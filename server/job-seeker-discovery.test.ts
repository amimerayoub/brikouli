import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Job Seeker discovery composition", () => {
  it("uses deferred Arabic search, category filters, live gig data, and authenticated favorite state on Home", () => {
    const home = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
    expect(home).toContain("useDeferredValue(search)");
    expect(home).toContain("trpc.brikouli.gigs.listForJobSeeker.useQuery");
    expect(home).toContain("JobSeekerCategories");
    expect(home).toContain("trpc.brikouli.favorites.ids.useQuery");
    expect(home).not.toContain("phase3Jobs");
  });

  it("preserves MapLibre nearby filtering while exposing the selected gig save action", () => {
    const discovery = readFileSync(new URL("../client/src/components/maps/MapDiscovery.tsx", import.meta.url), "utf8");
    expect(discovery).toContain("radiusKm, sort, category, urgentOnly, limit: 50");
    expect(discovery).toContain("const [gigSearch, setGigSearch] = useState");
    expect(discovery).toContain("useDeferredValue(gigSearch.trim())");
    expect(discovery).toContain("ابحث في الفرص القريبة");
    expect(discovery).toContain("NoSearchResults query={gigSearch}");
    expect(discovery).toContain("toggleSelectedGigSave");
    expect(discovery).toContain("isSaved={savedGigIds.has(selectedGig.id)}");
  });
});
