import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Result<T> = { success: true; data: T };
type Gig = { id: string; title: string; employerName: string; employerId: string; employerAvatarUrl: null; description: string; category: string; city: string; neighborhood: string; latitude: number; longitude: number; payment: number; paymentType: "fixed"; duration: string; urgent: boolean; status: "active"; createdAt: string; distanceMeters: number };
const gig: Gig = { id: "9e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", employerId: "4e1b6a8d-e7cd-4199-858d-1e1d1e76b5a1", employerName: "متجر الحي", employerAvatarUrl: null, title: "ترتيب مساحة المتجر", description: "وصف للاختبار.", category: "متاجر", city: "الدار البيضاء", neighborhood: "المعاريف", latitude: 33.57, longitude: -7.58, payment: 110, paymentType: "fixed", duration: "4 ساعات", urgent: false, status: "active", createdAt: "2026-08-21T09:00:00.000Z", distanceMeters: 700 };

const cache = vi.hoisted(() => {
  let ids: string[] = [];
  let items: Record<string, unknown>[] = [];
  let failRemove = false;
  const resolve = <T,>(current: Result<T>, next: Result<T> | ((value: Result<T>) => Result<T>)) => typeof next === "function" ? (next as (value: Result<T>) => Result<T>)(current) : next;
  return {
    get ids() { return ids; }, set ids(value: string[]) { ids = value; }, get items() { return items; }, set items(value: Record<string, unknown>[]) { items = value; }, get failRemove() { return failRemove; }, set failRemove(value: boolean) { failRemove = value; },
    setIds(next: Result<string[]> | ((value: Result<string[]>) => Result<string[]>)) { ids = resolve({ success: true, data: ids }, next).data; },
    setItems(next: Result<Record<string, unknown>[]> | ((value: Result<Record<string, unknown>[]>) => Result<Record<string, unknown>[]>)) { items = resolve({ success: true, data: items }, next).data; },
  };
});

type Options = { onMutate?: (input: { gigId: string }) => Promise<unknown>; onError?: (error: Error, input: { gigId: string }, context: unknown) => void; onSettled?: () => void };
function useFavoriteMutation(kind: "save" | "remove", options: Options) { return { mutate: async (input: { gigId: string }, callbacks: { onSuccess?: (response: { success: true; data: { gigId: string } }) => void } = {}) => { const context = await options.onMutate?.(input); const fail = kind === "remove" && cache.failRemove; cache.failRemove = false; if (fail) options.onError?.(new Error("failed"), input, context); else callbacks.onSuccess?.({ success: true, data: { gigId: input.gigId } }); options.onSettled?.(); } }; }

vi.mock("../client/src/lib/trpc", () => ({ trpc: { brikouli: { gigs: { listForJobSeeker: { useQuery: () => ({ data: { success: true, data: [gig] }, isLoading: false, isError: false, refetch: vi.fn() }) }, nearby: { useQuery: () => ({ data: { success: true, data: [gig] }, isLoading: false, refetch: vi.fn() }) } }, favorites: { ids: { useQuery: () => ({ data: { success: true, data: cache.ids } }) }, list: { useQuery: () => ({ data: { success: true, data: cache.items }, isLoading: false, isError: false, refetch: vi.fn() }) }, save: { useMutation: (options: Options) => useFavoriteMutation("save", options) }, remove: { useMutation: (options: Options) => useFavoriteMutation("remove", options) } }, locations: { search: { useMutation: () => ({ mutate: vi.fn() }) } } }, useUtils: () => ({ brikouli: { favorites: { ids: { cancel: vi.fn(), getData: () => ({ success: true, data: cache.ids }), setData: (_input: unknown, next: Result<string[]> | ((value: Result<string[]>) => Result<string[]>)) => cache.setIds(next), invalidate: vi.fn() }, list: { cancel: vi.fn(), getData: () => ({ success: true, data: cache.items }), setData: (_input: unknown, next: Result<Record<string, unknown>[]> | ((value: Result<Record<string, unknown>[]>) => Result<Record<string, unknown>[]>)) => cache.setItems(next), invalidate: vi.fn() } } } }) } }));
vi.mock("../client/src/hooks/useSupabaseSession", () => ({ useSupabaseSession: () => ({ isAuthenticated: true, loading: false, user: { id: "user" } }) }));
vi.mock("../client/src/components/phase3/AppShell", async () => { const R = await import("react"); return { AppShell: ({ children }: { children: React.ReactNode }) => R.createElement("div", null, children), PageHeading: ({ title }: { title: string }) => R.createElement("h1", null, title) }; });
vi.mock("../client/src/components/phase3/BottomSheet", async () => { const R = await import("react"); return { BottomSheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? R.createElement("div", null, children) : null }; });
vi.mock("../client/src/components/phase3/SearchField", async () => { const R = await import("react"); return { SearchField: () => R.createElement("div") }; });
vi.mock("../client/src/components/phase3/AppButton", async () => { const R = await import("react"); return { AppButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => R.createElement("button", { onClick }, children) }; });
vi.mock("../client/src/components/phase3/EmptyState", async () => { const R = await import("react"); return { EmptyState: ({ title }: { title: string }) => R.createElement("p", null, title), ErrorState: () => R.createElement("p", null, "خطأ") }; });
vi.mock("../client/src/components/jobSeeker/JobSeekerSearch", async () => { const R = await import("react"); return { JobSeekerSearch: () => R.createElement("div") }; });
vi.mock("../client/src/components/jobSeeker/JobSeekerCategories", async () => { const R = await import("react"); return { JobSeekerCategories: () => R.createElement("div") }; });
vi.mock("../client/src/components/jobSeeker/JobSeekerFeedback", async () => { const R = await import("react"); return { JobSeekerCardSkeleton: () => R.createElement("div"), JobSeekerLoadError: () => R.createElement("p", null, "خطأ"), NoJobsFound: () => R.createElement("p"), NoSearchResults: () => R.createElement("p"), NoSavedGigs: () => R.createElement("p"), JobSeekerFeedback: () => R.createElement("p") }; });
vi.mock("../client/src/components/maps/MapView", async () => { const R = await import("react"); return { BrikouliMapView: ({ gigs, onSelect }: { gigs: Gig[]; onSelect: (item: Gig) => void }) => R.createElement("button", { onClick: () => onSelect(gigs[0]!) }, "فتح الخريطة") }; });
vi.mock("../client/src/lib/map/geolocation", () => ({ requestUserLocation: async () => ({ status: "ready", coordinates: null, message: null }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const { default: Home } = await import("../client/src/pages/Home");
const { MapDiscovery } = await import("../client/src/components/maps/MapDiscovery");
const { default: SavedGigs } = await import("../client/src/pages/SavedGigs");
afterEach(cleanup);
beforeEach(() => { cache.ids = []; cache.items = []; cache.failRemove = false; });

describe("Optimistic favorites real surfaces", () => {
  it("updates and rolls back Home’s actual favorite control", async () => { const user = userEvent.setup(); const view = render(React.createElement(Home)); await user.click(screen.getAllByRole("button", { name: "حفظ الفرصة" })[0]!); view.rerender(React.createElement(Home)); expect(screen.getAllByRole("button", { name: "إزالة من المحفوظات" })).not.toHaveLength(0); cache.failRemove = true; await user.click(screen.getAllByRole("button", { name: "إزالة من المحفوظات" })[0]!); view.rerender(React.createElement(Home)); expect(screen.getAllByRole("button", { name: "إزالة من المحفوظات" })).not.toHaveLength(0); });
  it("updates and rolls back the real MapLibre marker-sheet control", async () => { const user = userEvent.setup(); const view = render(React.createElement(MapDiscovery)); await user.click(screen.getByRole("button", { name: "فتح الخريطة" })); await user.click(screen.getAllByRole("button", { name: "حفظ الفرصة" }).at(-1)!); view.rerender(React.createElement(MapDiscovery)); expect(screen.getByRole("button", { name: "محفوظة في حسابك" })).toBeTruthy(); cache.failRemove = true; await user.click(screen.getByRole("button", { name: "محفوظة في حسابك" })); view.rerender(React.createElement(MapDiscovery)); expect(screen.getByRole("button", { name: "محفوظة في حسابك" })).toBeTruthy(); });
  it("removes and rolls back actual Saved Gigs cards", async () => { const user = userEvent.setup(); cache.ids = [gig.id]; cache.items = [{ ...gig, savedAt: "2026-08-21T09:00:00.000Z" }]; const view = render(React.createElement(SavedGigs)); cache.failRemove = true; await user.click(screen.getByRole("button", { name: "إزالة من المحفوظات" })); view.rerender(React.createElement(SavedGigs)); expect(screen.getByText("ترتيب مساحة المتجر")).toBeTruthy(); await user.click(screen.getByRole("button", { name: "إزالة من المحفوظات" })); view.rerender(React.createElement(SavedGigs)); expect(screen.queryByText("ترتيب مساحة المتجر")).toBeNull(); });
});
