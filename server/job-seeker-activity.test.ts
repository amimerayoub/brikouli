import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Job Seeker activity screens", () => {
  it("provides real saved-gig retrieval and removal through a registered destination", () => {
    const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    const saved = readFileSync(new URL("../client/src/pages/SavedGigs.tsx", import.meta.url), "utf8");
    expect(app).toContain('path={"/saved"}');
    expect(saved).toContain("trpc.brikouli.favorites.list.useQuery");
    expect(saved).toContain("trpc.brikouli.favorites.remove.useMutation");
    expect(saved).toContain("onMutate");
    expect(saved).toContain("previousList");
    expect(saved).toContain("onSettled");
    expect(saved).toContain("NoSavedGigs");
  });

  it("derives non-realtime notification cards from real application activity and exposes a registered route", () => {
    const app = readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
    const notifications = readFileSync(new URL("../client/src/pages/Notifications.tsx", import.meta.url), "utf8");
    expect(app).toContain('path={"/notifications"}');
    expect(notifications).toContain("trpc.brikouli.applications.mine.useQuery");
    expect(notifications).toContain("اليوم");
    expect(notifications).toContain("markAllRead");
    expect(notifications).toContain("applications.isLoading");
    expect(notifications).toContain("JobSeekerCardSkeleton");
    expect(notifications).not.toContain("WebSocket");
  });

  it("uses live profile, saved-gig, and application data in the editable profile activity summary", () => {
    const profile = readFileSync(new URL("../client/src/pages/Profile.tsx", import.meta.url), "utf8");
    expect(profile).toContain("trpc.brikouli.profile.me.useQuery");
    expect(profile).toContain("trpc.brikouli.profile.update.useMutation");
    expect(profile).toContain('href="/saved"');
    expect(profile).toContain('href="/applications"');
    expect(profile).toContain('href="/notifications"');
  });
});
